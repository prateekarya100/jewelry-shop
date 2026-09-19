-- Run automatically on server startup (see db.js) — safe to run repeatedly,
-- every statement is idempotent (CREATE ... IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT UNIQUE,
  phone          TEXT UNIQUE,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
  mfa_secret     TEXT,
  mfa_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Adds the column for databases created before this feature existed —
-- harmless no-op if it's already there.
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Cart stored as JSONB on the user — survives page refresh, syncs across devices.
ALTER TABLE users ADD COLUMN IF NOT EXISTS cart JSONB NOT NULL DEFAULT '[]';

-- Holds a registration in limbo until its email OTP is verified — the real
-- `users` row is only created once the code is confirmed, so an unverified
-- signup never becomes a usable account.
CREATE TABLE IF NOT EXISTS pending_registrations (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  otp_hash      TEXT NOT NULL,
  attempts      INTEGER NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_registrations_email ON pending_registrations(lower(email));

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id                  TEXT PRIMARY KEY,               -- e.g. ORD2509054821
  user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name       TEXT NOT NULL,
  customer_email      TEXT,
  customer_phone      TEXT,
  customer_address    TEXT,
  customer_city       TEXT,
  customer_state      TEXT,
  customer_pincode    TEXT,
  payment_method      TEXT NOT NULL,                  -- cod | upi | razorpay
  payment_ref         TEXT,                            -- Razorpay payment id, if any
  payment_status      TEXT NOT NULL,                  -- paid | confirmed-cod
  fulfillment_status  TEXT NOT NULL DEFAULT 'confirmed',
  total               NUMERIC(10, 2) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL,
  title       TEXT NOT NULL,
  qty         INTEGER NOT NULL,
  unit_price  NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  category     TEXT NOT NULL,
  tagline      TEXT DEFAULT '',
  description  TEXT DEFAULT '',
  price        NUMERIC(10, 2) NOT NULL,
  discount     NUMERIC(5, 2) NOT NULL DEFAULT 0,
  images       TEXT[] NOT NULL DEFAULT '{}',
  video        TEXT DEFAULT '',
  material     TEXT DEFAULT '',
  stock        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);

-- Admin roles with granular permissions
CREATE TABLE IF NOT EXISTS admin_roles (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin sub-users (staff accounts created by super admin)
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id       INTEGER REFERENCES admin_roles(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);