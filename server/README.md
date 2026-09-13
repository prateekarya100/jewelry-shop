# Priyasa Fashion backend

A real production-style backend: PostgreSQL database, JWT-based auth with
role-based access control (customer/admin), optional two-factor
authentication, password reset, and transactional email — on top of the
same Razorpay payment flow as before (untouched).

## What's in here

- **`db.js`** — Postgres connection pool, auto-creates the schema on startup
- **`schema.sql`** — `users`, `password_reset_tokens`, `orders`, `order_items`
- **`auth.js`** — JWT signing/verification, RBAC middleware, password hashing
- **`users-db.js`** — registration, login, password reset, 2FA (TOTP)
- **`orders-db.js`** — orders backed by the database, not JSON files
- **`mailer.js`** — welcome/reset/order-status emails via Gmail SMTP
- **`seed-admin.js`** — one-time script to create your admin account
- **`products.js`** — unchanged, still a JSON file (see note at the bottom)
- **`index.js`** — wires it all together; the Razorpay `/api/create-order`
  and `/api/verify-payment` routes are **byte-for-byte identical** to
  before this upgrade

## 1. Get a free database (Neon)

1. Go to **neon.tech** → Sign up (GitHub sign-in is fastest, no card needed).
2. Create a project — pick any name and region close to you.
3. On the project dashboard, find **"Connection string"** and copy it. It
   looks like:
   ```
   postgresql://neondb_owner:AbC123xyz@ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Paste that whole string into `server/.env` as `DATABASE_URL`.

That's it — no manual table creation needed. The server runs `schema.sql`
automatically every time it starts (safe to run repeatedly, it only
creates what's missing).

## 2. Set up Gmail for sending emails

Gmail won't accept your normal password for this — you need an **App
Password**, a 16-character code Google generates specifically for apps.

1. Go to **myaccount.google.com/security**.
2. Turn on **2-Step Verification** if it isn't already on (App Passwords
   require this).
3. Go to **myaccount.google.com/apppasswords**.
4. Under "App name", type something like `Priyasa Fashion`, click Create.
5. Google shows a 16-character password (like `abcd efgh ijkl mnop`) —
   copy it, spaces don't matter.
6. In `server/.env`:
   ```
   GMAIL_USER=youraddress@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   ```

If you skip this, the server still works fine — emails just get logged to
the console instead of sent, which is genuinely useful for local testing
(you can copy a password-reset link straight out of the terminal).

## 3. Generate a JWT secret

Already done for you in `.env` — a random one was generated. If you ever
want a fresh one:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 4. Create your admin account

```bash
cd server
npm install
# fill in .env first (DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD at minimum)
npm run seed-admin
```

This creates one admin user in the database. Sign in with `ADMIN_EMAIL` /
`ADMIN_PASSWORD` from `.env` at `/admin` on your site. Run this command
again any time to reset the admin password.

## 5. Run it

```bash
npm run dev
```

You should see `✅ Database schema ready` followed by the usual "listening
on" line.

## How auth works now

One `users` table, a `role` column (`customer` or `admin`). Everyone signs
in through the same `POST /api/auth/login` — the frontend routes to the
Admin Dashboard or the customer account page based on the role in the
response. There's no public admin signup; admins only come from
`seed-admin.js`.

Sessions are JWTs (7-day expiry), not server-side session storage — so
unlike before, **restarting the server no longer logs everyone out**.

### Two-factor authentication

Optional, per-account, using standard TOTP (works with Google
Authenticator, Authy, 1Password, etc.). A customer enables it from their
account page's Security section — scans a QR code, confirms with a code,
done. From then on, login requires a correct password *and* a 6-digit
code. Admins can have it too, using the same mechanism, from the same
`/api/auth/2fa/*` endpoints (no UI for it in the Admin Dashboard yet, but
the backend supports it identically).

### Password reset

`POST /api/auth/forgot-password` always responds the same way whether or
not the account exists (so it can't be used to check who has an account),
emails a reset link if it does. The link points at
`{FRONTEND_URL}/reset-password?token=...`. Tokens expire in 1 hour and can
only be used once.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/products` | none | Storefront catalogue |
| POST | `/api/admin/products` | Admin | Add a product |
| PUT | `/api/admin/products/:id` | Admin | Edit a product |
| DELETE | `/api/admin/products/:id` | Admin | Remove a product |
| POST | `/api/auth/register` | none | `{ name, email, phone, password }` |
| POST | `/api/auth/login` | none | `{ identifier, password }` — may return `{ mfaRequired: true, challengeToken }` |
| POST | `/api/auth/login/mfa` | Challenge token | `{ code }` → real session token |
| GET | `/api/auth/me` | Any user | Current account info |
| POST | `/api/auth/forgot-password` | none | `{ identifier }` |
| POST | `/api/auth/reset-password` | none | `{ token, newPassword }` |
| POST | `/api/auth/2fa/setup` | Any user | Returns a QR code |
| POST | `/api/auth/2fa/confirm` | Any user | `{ code }` — enables 2FA |
| POST | `/api/auth/2fa/disable` | Any user | Turns 2FA off |
| POST | `/api/orders` | Optional | Records an order (guest or logged-in) |
| GET | `/api/orders/mine` | Any user | That user's own orders |
| GET | `/api/admin/orders` | Admin | Every order |
| PUT | `/api/admin/orders/:id/status` | Admin | Change status, emails the customer |
| POST | `/api/create-order` | none | Creates a Razorpay order, server-computed amount |
| POST | `/api/verify-payment` | none | Verifies a Razorpay payment signature |

## What's still JSON-based (by design, for now)

Nothing — products, orders, and users all now live in the database.
`server/data/products.json` still exists, but only as a one-time seed
source: the first time the server connects to a brand-new, empty
database, it automatically copies those products in, so your existing
catalogue isn't lost when switching from the old file-based storage. On
every later startup this is a no-op, since the table won't be empty.
Editing that JSON file after the first run has no effect — use the Admin
Dashboard instead.

## Deploying

Same as before — Render or Railway both work. Just make sure to set every
variable from `.env` (especially `DATABASE_URL`, `JWT_SECRET`,
`GMAIL_USER`/`GMAIL_APP_PASSWORD`, and `FRONTEND_URL` pointing at your
deployed frontend) as environment variables there, and run
`npm run seed-admin` once (e.g. via Render's Shell tab) after your first
deploy to create the admin account in the live database.
