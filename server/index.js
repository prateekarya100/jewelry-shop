import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import * as store from './products.js';
import * as orderStore from './orders-db.js';
import * as userStore from './users-db.js';
import { initSchema } from './db.js';
import * as mailer from './mailer.js';
import {
  signToken, signMfaChallengeToken, verifyToken,
  requireAuth, requireRole, requireMfaChallenge,
} from './auth.js';

const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  PORT = 4000,
  ALLOWED_ORIGINS = 'http://localhost:5173',
} = process.env;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn(
    '⚠️  RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing.\n' +
    '    Copy server/.env.example to server/.env and fill in your real keys.'
  );
}

const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

const app = express();
app.use(express.json());

const allowedOrigins = ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed`));
    },
  })
);

// ---------------------------------------------------------------------------
// Products — the shared catalogue. GET is public (the storefront needs it to
// render); create/update/delete require an admin session.
// ---------------------------------------------------------------------------

// Since JWTs are stateless, a suspended/deactivated customer's existing
// token would otherwise keep working until it naturally expires (up to 7
// days). This re-checks their CURRENT status from the database, so an
// admin action takes effect immediately — chain this after requireAuth on
// any route that should stop working the instant an account is disabled.
async function requireActiveUser(req, res, next) {
  const user = await userStore.getUserById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Contact support for help.' });
  }
  if (user.status === 'deactivated') {
    return res.status(403).json({ error: 'This account has been deactivated. Contact support for help.' });
  }
  next();
}

app.get('/api/products', async (_req, res) => {
  res.json(await store.loadProducts());
});

app.post('/api/admin/products', requireRole('admin'), async (req, res) => {
  const p = req.body || {};
  if (!p.title || !p.category || p.price === undefined) {
    return res.status(400).json({ error: 'title, category and price are required' });
  }
  const created = await store.addProduct({
    title: String(p.title),
    category: String(p.category),
    tagline: String(p.tagline || ''),
    description: String(p.description || ''),
    price: Number(p.price) || 0,
    discount: Number(p.discount) || 0,
    images: Array.isArray(p.images) ? p.images : [],
    video: String(p.video || ''),
    material: String(p.material || ''),
    stock: Number(p.stock) || 0,
  });
  res.status(201).json(created);
});

app.put('/api/admin/products/:id', requireRole('admin'), async (req, res) => {
  const updated = await store.updateProduct(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Product not found' });
  res.json(updated);
});

app.delete('/api/admin/products/:id', requireRole('admin'), async (req, res) => {
  const ok = await store.deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Product not found' });
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// Auth — one unified user table (role: 'customer' | 'admin'), JWT-based.
// Admins are seeded via `npm run seed-admin` (see server/README.md) — there
// is no public admin signup. Everyone signs in through the same endpoint;
// the frontend routes to the Admin Dashboard or the customer account page
// based on the role in the response.
// ---------------------------------------------------------------------------

app.post('/api/auth/register/start', async (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and a password are required' });
  }
  try {
    await userStore.startRegistration({ name, email, phone, password });
    res.json({ ok: true, message: 'A verification code has been sent to your email.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/register/resend', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    await userStore.resendRegistrationOtp(email);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/register/verify', async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });
  try {
    const user = await userStore.verifyRegistrationOtp(email, code);
    mailer.sendWelcomeEmail(user); // fire-and-forget — never blocks signup
    const token = signToken(user);
    res.status(201).json({ token, user: userStore.publicUser(user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/phone and password are required' });
  }
  const user = await userStore.verifyLogin(identifier, password);
  if (!user) return res.status(401).json({ error: 'Invalid email/phone or password' });

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Contact support for help.' });
  }
  if (user.status === 'deactivated') {
    return res.status(403).json({ error: 'This account has been deactivated. Contact support for help.' });
  }

  if (user.mfa_enabled) {
    // Password was correct, but a 2FA code is still needed. Issue a
    // short-lived challenge token instead of a real session.
    return res.json({ mfaRequired: true, challengeToken: signMfaChallengeToken(user) });
  }
  res.json({ token: signToken(user), user: userStore.publicUser(user) });
});

app.post('/api/auth/login/mfa', requireMfaChallenge, async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Code is required' });
  const valid = await userStore.verifyMfaCode(req.mfaUserId, code);
  if (!valid) return res.status(401).json({ error: 'Invalid code' });
  const user = await userStore.getUserById(req.mfaUserId);
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Contact support for help.' });
  }
  if (user.status === 'deactivated') {
    return res.status(403).json({ error: 'This account has been deactivated. Contact support for help.' });
  }
  res.json({ token: signToken(user), user: userStore.publicUser(user) });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await userStore.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Account not found' });
  res.json(userStore.publicUser(user));
});

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

app.post('/api/auth/forgot-password', async (req, res) => {
  const { identifier } = req.body || {};
  const user = identifier && await userStore.findByEmailOrPhone(identifier);
  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to check which emails/phones have accounts.
  if (user && user.email) {
    const token = await userStore.createPasswordResetToken(user.id);
    mailer.sendPasswordResetEmail(user, token);
  }
  res.json({ ok: true, message: 'If an account exists, a reset link has been sent.' });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  const userId = await userStore.consumePasswordResetToken(token);
  if (!userId) return res.status(400).json({ error: 'This reset link is invalid or has expired' });
  await userStore.updatePassword(userId, newPassword);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Two-factor authentication (TOTP) — optional, enabled per account.
// ---------------------------------------------------------------------------

app.post('/api/auth/2fa/setup', requireAuth, requireActiveUser, async (req, res) => {
  const { qrCodeDataUrl } = await userStore.startMfaSetup(req.user.id, req.user.email || req.user.phone);
  res.json({ qrCodeDataUrl });
});

app.post('/api/auth/2fa/confirm', requireAuth, requireActiveUser, async (req, res) => {
  const { code } = req.body || {};
  const ok = await userStore.confirmMfaSetup(req.user.id, code);
  if (!ok) return res.status(400).json({ error: 'Invalid code — check your authenticator app and try again' });
  res.json({ ok: true });
});

app.post('/api/auth/2fa/disable', requireAuth, requireActiveUser, async (req, res) => {
  await userStore.disableMfa(req.user.id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Orders — shared database so an order placed on a customer's phone shows up
// in the Admin Dashboard, and status changes made by the admin are visible
// back to that customer (and emailed to them) regardless of device.
// ---------------------------------------------------------------------------

// Public: the frontend calls this right after an order is placed (any
// payment method). No auth required — guest checkout must work — but if a
// customer is logged in, the frontend attaches their token so the order
// links to their account for "my orders" lookups later.
app.post('/api/orders', async (req, res) => {
  const body = req.body || {};
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: 'Invalid order payload' });
  }
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  const userId = payload && !payload.mfaChallenge ? payload.sub : null;

  try {
    const saved = await orderStore.addOrder({
      id: body.id,
      userId,
      customer: body.customer || {},
      paymentMethod: body.paymentMethod,
      paymentRef: body.paymentRef,
      status: body.status,
      fulfillmentStatus: body.fulfillmentStatus,
      total: body.total,
      items: body.items,
    });
    mailer.sendOrderConfirmationEmail(saved); // fire-and-forget
    res.status(201).json(saved);
  } catch (err) {
    // "Not enough stock" errors are expected, user-facing outcomes — show
    // the real message. Anything else is unexpected, so log it and keep
    // the response generic (don't leak internal details to the browser).
    if (err.message?.startsWith('Not enough stock')) {
      return res.status(409).json({ error: err.message });
    }
    console.error('Failed to save order:', err);
    res.status(500).json({ error: 'Could not save order' });
  }
});

// Admin: see every order.
// ---------------------------------------------------------------------------
// Admin customer management — suspend, deactivate, reactivate, or
// permanently delete a customer account.
// ---------------------------------------------------------------------------

app.get('/api/admin/customers', requireRole('admin'), async (_req, res) => {
  try {
    res.json(await userStore.getAllCustomers());
  } catch (err) {
    console.error('Failed to load customers:', err);
    res.status(500).json({ error: 'Could not load customers' });
  }
});

app.put('/api/admin/customers/:id/status', requireRole('admin'), async (req, res) => {
  const { status } = req.body || {};
  try {
    await userStore.setCustomerStatus(req.params.id, status);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/customers/:id', requireRole('admin'), async (req, res) => {
  try {
    const ok = await userStore.deleteCustomer(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Customer not found' });
    res.status(204).end();
  } catch (err) {
    console.error('Failed to delete customer:', err);
    res.status(500).json({ error: 'Could not delete customer' });
  }
});

app.get('/api/admin/orders', requireRole('admin'), async (_req, res) => {
  res.json(await orderStore.getAllOrders());
});

app.put('/api/admin/orders/:id/status', requireRole('admin'), async (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'status is required' });
  const updated = await orderStore.updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  mailer.sendOrderStatusEmail(updated, status); // fire-and-forget
  res.json(updated);
});

// Customer: their own past orders, matched by account id or by the
// phone/email on file (covers orders placed as a guest before signing up).
app.get('/api/orders/mine', requireRole('customer'), requireActiveUser, async (req, res) => {
  const orders = await orderStore.getOrdersFor({
    userId: req.user.id,
    phone: req.user.phone,
    email: req.user.email,
  });
  res.json(orders);
});

// ---------------------------------------------------------------------------
// Payments — creates the Razorpay order with a server-computed amount, and
// verifies the payment signature after success. See README.md.
// ---------------------------------------------------------------------------

app.post('/api/create-order', async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }
    let amount;
    try {
      amount = await store.computeAmount(items);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Computed amount is invalid' });
    }
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('create-order failed:', err);
    res.status(500).json({ error: 'Could not create order' });
  }
});

app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ verified: false, error: 'Missing fields' });
  }
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  const verified = expectedSignature === razorpay_signature;
  res.json({ verified });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// Safety net: an error that slips through a route without its own try/catch
// (a bug, or an unexpected database hiccup) should never take down the
// entire server — it should just get logged, so one bad request can't stop
// every customer from reaching the site.
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection (server stayed up):', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (server stayed up):', err);
});

initSchema()
  .then(() => store.seedFromJsonIfEmpty())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Priyasa Fashion backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Could not initialize database schema:', err);
    process.exit(1);
  });
