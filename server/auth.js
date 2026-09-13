import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set in server/.env — using an insecure default. Set a real one before deploying.');
}
const SECRET = JWT_SECRET || 'dev-only-insecure-secret-change-me';

const TOKEN_TTL = '7d';
const TEMP_MFA_TOKEN_TTL = '10m'; // short-lived token used only during the 2FA challenge step

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone },
    SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

/** A short-lived token issued after a correct password when the account has
 * 2FA enabled — only usable to complete the 2FA challenge, not as a real
 * session token. */
export function signMfaChallengeToken(user) {
  return jwt.sign({ sub: user.id, mfaChallenge: true }, SECRET, { expiresIn: TEMP_MFA_TOKEN_TTL });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function tokenFromHeader(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

/** Requires a valid, full (non-MFA-challenge) session token. Attaches
 * req.user = { id, role, name, email, phone }. */
export function requireAuth(req, res, next) {
  const payload = verifyToken(tokenFromHeader(req));
  if (!payload || payload.mfaChallenge) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.user = { id: payload.sub, role: payload.role, name: payload.name, email: payload.email, phone: payload.phone };
  next();
}

/** Requires a valid session token AND a specific role. */
export function requireRole(role) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (req.user.role !== role) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      next();
    });
  };
}

/** Verifies an MFA-challenge token (issued right after a correct password,
 * before the 2FA code is checked). Attaches req.mfaUserId. */
export function requireMfaChallenge(req, res, next) {
  const payload = verifyToken(tokenFromHeader(req));
  if (!payload || !payload.mfaChallenge) {
    return res.status(401).json({ error: 'Invalid or expired challenge' });
  }
  req.mfaUserId = payload.sub;
  next();
}

// ---------------------------------------------------------------------------
// Password hashing — Node's built-in scrypt, no extra dependency needed.
// ---------------------------------------------------------------------------

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPasswordHash(password, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(check, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Password reset tokens — a random token is emailed to the user; only its
// hash is stored, same idea as password hashing, so a leaked database
// doesn't expose usable reset links.
// ---------------------------------------------------------------------------

export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ---------------------------------------------------------------------------
// Email OTP (for registration verification) — a 6-digit code, hashed before
// storage the same way as reset tokens, so a leaked database doesn't expose
// usable codes.
// ---------------------------------------------------------------------------

export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000)); // 6 digits, 100000-999999
}

export function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}
