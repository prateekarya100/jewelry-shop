import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import * as store from './products.js';
import * as orderStore from './orders.js';
import * as customerStore from './customers.js';
import { createSession, destroySession, requireAdmin, requireCustomer, optionalCustomerId } from './auth.js';

const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  PORT = 4000,
  ALLOWED_ORIGINS = 'http://localhost:5173',
  ADMIN_USERNAME = 'admin',
  ADMIN_PASSWORD = 'priyasa2026',
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

app.get('/api/products', (_req, res) => {
  res.json(store.loadProducts());
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const p = req.body || {};
  if (!p.title || !p.category || p.price === undefined) {
    return res.status(400).json({ error: 'title, category and price are required' });
  }
  const created = store.addProduct({
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

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const updated = store.updateProduct(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Product not found' });
  res.json(updated);
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const ok = store.deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Product not found' });
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// Admin auth — a single shop-owner account, credentials set via .env.
// ---------------------------------------------------------------------------

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ token: createSession() });
  }
  res.status(401).json({ error: 'Invalid username or password' });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = req.headers.authorization.slice(7);
  destroySession(token);
  res.status(204).end();
});

app.get('/api/admin/me', requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Orders — shared storage so an order placed on a customer's phone shows up
// in the Admin Dashboard, and status changes made by the admin are visible
// back to that customer, regardless of device.
// ---------------------------------------------------------------------------

// Public: the frontend calls this right after an order is placed (any
// payment method). No auth required — guest checkout must work — but if a
// customer is logged in, the frontend attaches their token so the order
// links to their account for "my orders" lookups later.
app.post('/api/orders', (req, res) => {
  const order = req.body || {};
  if (!order.id || !Array.isArray(order.items)) {
    return res.status(400).json({ error: 'Invalid order payload' });
  }
  // Best-effort link to a customer account if one is logged in — but a
  // missing/invalid token is fine too, since guest checkout must work.
  const customerId = optionalCustomerId(req);
  const saved = orderStore.addOrder({ ...order, customerId: customerId || order.customerId || null });
  res.status(201).json(saved);
});

// Admin: see every order.
app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  res.json(orderStore.loadOrders());
});

app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'status is required' });
  const updated = orderStore.updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});

// Customer: their own past orders, matched by account id or by the
// phone/email on file (covers orders placed as a guest before signing up).
app.get('/api/customer/orders', requireCustomer, (req, res) => {
  const customer = customerStore.getCustomerById(req.customerId);
  if (!customer) return res.status(404).json({ error: 'Account not found' });
  const orders = orderStore.getOrdersFor({
    customerId: customer.id,
    phone: customer.phone,
    email: customer.email,
  });
  res.json(orders);
});

// ---------------------------------------------------------------------------
// Customer accounts — separate from the single admin login above. Anyone
// can register with name/email/phone/password, then sign in to see their
// order history from any device.
// ---------------------------------------------------------------------------

app.post('/api/customer/register', (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || (!email && !phone) || !password) {
    return res.status(400).json({ error: 'Name, an email or phone, and a password are required' });
  }
  try {
    const customer = customerStore.createCustomer({ name, email, phone, password });
    const token = createSession('customer', customer.id);
    res.status(201).json({ token, customer: customerStore.publicCustomer(customer) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/customer/login', (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/phone and password are required' });
  }
  const customer = customerStore.verifyLogin(identifier, password);
  if (!customer) return res.status(401).json({ error: 'Invalid email/phone or password' });
  const token = createSession('customer', customer.id);
  res.json({ token, customer: customerStore.publicCustomer(customer) });
});

app.post('/api/customer/logout', requireCustomer, (req, res) => {
  const token = req.headers.authorization.slice(7);
  destroySession(token);
  res.status(204).end();
});

app.get('/api/customer/me', requireCustomer, (req, res) => {
  const customer = customerStore.getCustomerById(req.customerId);
  if (!customer) return res.status(404).json({ error: 'Account not found' });
  res.json(customerStore.publicCustomer(customer));
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
      amount = store.computeAmount(items);
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

app.listen(PORT, () => {
  console.log(`Priyasa Fashion backend listening on http://localhost:${PORT}`);
});
