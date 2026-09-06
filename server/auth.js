import crypto from 'crypto';

// A deliberately simple session store for a small shop: tokens live in
// server memory (reset if the server restarts) and expire after a few
// hours. Sessions now carry a role ('admin' or 'customer') and an id, so
// the same mechanism serves both the shop owner and customer accounts.
// If you ever need sessions to survive restarts or scale to multiple
// server instances, swap this for Redis/a database table/JWTs — only
// createSession/getSession would need to change.

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const sessions = new Map(); // token -> { expiresAt, role, id }

export function createSession(role = 'admin', id = null) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS, role, id });
  return token;
}

export function destroySession(token) {
  sessions.delete(token);
}

function getSession(token) {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return s;
}

function tokenFromHeader(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

/** Express middleware: rejects the request unless a valid admin session is
 * present in the Authorization header as "Bearer <token>". */
export function requireAdmin(req, res, next) {
  const session = getSession(tokenFromHeader(req));
  if (!session || session.role !== 'admin') {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

/** Same idea, for a logged-in customer. Attaches req.customerId. */
export function requireCustomer(req, res, next) {
  const session = getSession(tokenFromHeader(req));
  if (!session || session.role !== 'customer') {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.customerId = session.id;
  next();
}

/** Non-throwing lookup used where a customer MAY be logged in but it's
 * optional (e.g. guest checkout) — returns the customer id or null. */
export function optionalCustomerId(req) {
  const session = getSession(tokenFromHeader(req));
  return session && session.role === 'customer' ? session.id : null;
}
