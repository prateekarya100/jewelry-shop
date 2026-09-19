import { authenticator } from "otplib";
import QRCode from "qrcode";
import { query } from "./db.js";
import {
  hashPassword,
  verifyPasswordHash,
  generateResetToken,
  hashResetToken,
  generateOtp,
  hashOtp,
} from "./auth.js";
import { sendOtpEmail } from "./mailer.js";

function normalize(identifier) {
  return (identifier || "").trim();
}

export async function findByEmailOrPhone(identifier) {
  const id = normalize(identifier);
  if (!id) return null;
  const { rows } = await query(
    `SELECT * FROM users WHERE lower(email) = lower($1) OR phone = $1 LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

export async function getUserById(id) {
  const { rows } = await query(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function createUser({
  name,
  email,
  phone,
  password,
  role = "customer",
}) {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  if (
    (email && (await findByEmailOrPhone(email))) ||
    (phone && (await findByEmailOrPhone(phone)))
  ) {
    throw new Error("An account with this email or phone already exists");
  }
  const passwordHash = hashPassword(password);
  const { rows } = await query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email || null, phone || null, passwordHash, role],
  );
  return rows[0];
}

export async function verifyLogin(identifier, password) {
  const user = await findByEmailOrPhone(identifier);
  if (!user) return null;
  if (!verifyPasswordHash(password, user.password_hash)) return null;
  return user;
}

export async function updatePassword(userId, newPassword) {
  const passwordHash = hashPassword(newPassword);
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
    passwordHash,
    userId,
  ]);
}

export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    mfaEnabled: u.mfa_enabled,
  };
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function createPasswordResetToken(userId) {
  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );
  return token; // the plain token — only this gets emailed, never stored
}

export async function consumePasswordResetToken(token) {
  const tokenHash = hashResetToken(token);
  const { rows } = await query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND used = FALSE AND expires_at > now()
     LIMIT 1`,
    [tokenHash],
  );
  const record = rows[0];
  if (!record) return null;
  await query(`UPDATE password_reset_tokens SET used = TRUE WHERE id = $1`, [
    record.id,
  ]);
  return record.user_id;
}

// ---------------------------------------------------------------------------
// Two-factor authentication (TOTP — works with Google Authenticator, Authy,
// etc.) via otplib, with a QR code for easy setup.
// ---------------------------------------------------------------------------

export async function startMfaSetup(userId, accountLabel) {
  const secret = authenticator.generateSecret();
  await query(
    `UPDATE users SET mfa_secret = $1, mfa_enabled = FALSE WHERE id = $2`,
    [secret, userId],
  );
  const otpauthUrl = authenticator.keyuri(
    accountLabel,
    "Priyasa Fashion",
    secret,
  );
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { secret, qrCodeDataUrl };
}

export async function confirmMfaSetup(userId, code) {
  const user = await getUserById(userId);
  if (!user?.mfa_secret) throw new Error("No MFA setup in progress");
  const valid = authenticator.verify({ token: code, secret: user.mfa_secret });
  if (!valid) return false;
  await query(`UPDATE users SET mfa_enabled = TRUE WHERE id = $1`, [userId]);
  return true;
}

export async function verifyMfaCode(userId, code) {
  const user = await getUserById(userId);
  if (!user?.mfa_secret) return false;
  return authenticator.verify({ token: code, secret: user.mfa_secret });
}

export async function disableMfa(userId) {
  await query(
    `UPDATE users SET mfa_enabled = FALSE, mfa_secret = NULL WHERE id = $1`,
    [userId],
  );
}

// ---------------------------------------------------------------------------
// Email OTP registration — no `users` row is created until the code is
// verified, so an abandoned/unverified signup never becomes a real account.
// ---------------------------------------------------------------------------

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

export async function startRegistration({ name, email, phone, password }) {
  if (!email) throw new Error("Email is required to verify your account");
  if (!password || password.length < 6)
    throw new Error("Password must be at least 6 characters");
  if (await findByEmailOrPhone(email))
    throw new Error("An account with this email already exists");
  if (phone && (await findByEmailOrPhone(phone)))
    throw new Error("An account with this phone already exists");

  const passwordHash = hashPassword(password);
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Replace any earlier pending attempt for this email, so requesting a new
  // code always invalidates the old one instead of accumulating rows.
  await query(
    `DELETE FROM pending_registrations WHERE lower(email) = lower($1)`,
    [email],
  );
  await query(
    `INSERT INTO pending_registrations (name, email, phone, password_hash, otp_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [name, email, phone || null, passwordHash, otpHash, expiresAt],
  );
  // Fire-and-forget: the code is already safely stored above, so the
  // person shouldn't have to wait on Gmail's response time (or worse, a
  // hung connection) before their "Sending code..." button resolves.
  sendOtpEmail(email, otp).catch((err) =>
    console.error("Failed to send OTP email:", err.message),
  );
}

export async function resendRegistrationOtp(email) {
  const { rows } = await query(
    `SELECT * FROM pending_registrations WHERE lower(email) = lower($1) LIMIT 1`,
    [email],
  );
  const pending = rows[0];
  if (!pending)
    throw new Error(
      "No pending registration found for this email — start again",
    );

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await query(
    `UPDATE pending_registrations SET otp_hash = $1, expires_at = $2, attempts = 0 WHERE id = $3`,
    [otpHash, expiresAt, pending.id],
  );
  sendOtpEmail(email, otp).catch((err) =>
    console.error("Failed to resend OTP email:", err.message),
  );
}

/** Verifies the code and, if correct, actually creates the user account.
 * Returns the new user row. Throws a user-facing message on failure. */
export async function verifyRegistrationOtp(email, code) {
  const { rows } = await query(
    `SELECT * FROM pending_registrations WHERE lower(email) = lower($1) LIMIT 1`,
    [email],
  );
  const pending = rows[0];
  if (!pending)
    throw new Error(
      "No pending registration found for this email — start again",
    );

  if (new Date(pending.expires_at) < new Date()) {
    await query(`DELETE FROM pending_registrations WHERE id = $1`, [
      pending.id,
    ]);
    throw new Error("This code has expired — request a new one");
  }
  if (pending.attempts >= MAX_OTP_ATTEMPTS) {
    await query(`DELETE FROM pending_registrations WHERE id = $1`, [
      pending.id,
    ]);
    throw new Error("Too many incorrect attempts — request a new code");
  }
  if (hashOtp(String(code)) !== pending.otp_hash) {
    await query(
      `UPDATE pending_registrations SET attempts = attempts + 1 WHERE id = $1`,
      [pending.id],
    );
    throw new Error("Incorrect code");
  }

  // Correct — create the real account now, using the password hash that
  // was already computed at step one (no need to re-hash).
  const { rows: userRows } = await query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, 'customer') RETURNING *`,
    [pending.name, pending.email, pending.phone, pending.password_hash],
  );
  await query(`DELETE FROM pending_registrations WHERE id = $1`, [pending.id]);
  return userRows[0];
}

// ---------------------------------------------------------------------------
// Admin customer management — suspend, deactivate, reactivate, or
// permanently delete a customer account.
// ---------------------------------------------------------------------------

export async function getAllCustomers() {
  const { rows } = await query(
    `SELECT id, name, email, phone, status, mfa_enabled, created_at
     FROM users WHERE role = 'customer' ORDER BY created_at DESC`,
  );
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    status: u.status,
    mfaEnabled: u.mfa_enabled,
    createdAt: u.created_at,
  }));
}

const VALID_STATUSES = ["active", "suspended", "deactivated"];

export async function setCustomerStatus(userId, status) {
  if (!VALID_STATUSES.includes(status)) throw new Error("Invalid status");
  const { rows } = await query(
    `UPDATE users SET status = $1 WHERE id = $2 AND role = 'customer' RETURNING id`,
    [status, userId],
  );
  if (!rows[0]) throw new Error("Customer not found");
}

/** Permanently removes the account. Their past orders are kept (for your
 * own records) but unlinked from the account — see the orders table's
 * ON DELETE SET NULL — so order history isn't silently destroyed. */
export async function deleteCustomer(userId) {
  const { rows } = await query(
    `DELETE FROM users WHERE id = $1 AND role = 'customer' RETURNING id`,
    [userId],
  );
  return !!rows[0];
}

// ---------------------------------------------------------------------------
// Cart — stored as JSONB on the user row so it survives page refreshes and
// syncs across devices. Each item: { productId, qty }.
// ---------------------------------------------------------------------------

export async function getCart(userId) {
  const { rows } = await query(`SELECT cart FROM users WHERE id = $1`, [
    userId,
  ]);
  if (!rows[0]) return [];
  return Array.isArray(rows[0].cart) ? rows[0].cart : [];
}

export async function setCart(userId, items) {
  const clean = (Array.isArray(items) ? items : [])
    .filter(
      (i) =>
        i &&
        typeof i.productId === "string" &&
        Number.isInteger(i.qty) &&
        i.qty > 0,
    )
    .map(({ productId, qty }) => ({ productId, qty }));
  await query(`UPDATE users SET cart = $1 WHERE id = $2`, [
    JSON.stringify(clean),
    userId,
  ]);
  return clean;
}

/** Merges a guest cart (from localStorage) into the server cart on login.
 * Server qty wins on conflicts — the server is the source of truth. */
export async function mergeCart(userId, guestItems) {
  const serverCart = await getCart(userId);
  const merged = [...serverCart];
  for (const guestItem of Array.isArray(guestItems) ? guestItems : []) {
    const existing = merged.find((i) => i.productId === guestItem.productId);
    if (!existing)
      merged.push({ productId: guestItem.productId, qty: guestItem.qty });
    // server qty wins — don't overwrite existing items
  }
  return setCart(userId, merged);
}
