import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'customers.json');

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]\n', 'utf-8');
}

export function loadCustomers() {
  ensureFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

export function saveCustomers(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2) + '\n', 'utf-8');
}

// Password hashing via Node's built-in scrypt — no extra dependency needed.
// Stored as "salt:hash" in one string.
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(check, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function normalize(identifier) {
  return (identifier || '').trim().toLowerCase();
}

export function findByEmailOrPhone(identifier) {
  const id = normalize(identifier);
  if (!id) return null;
  return loadCustomers().find(
    (c) => (c.email && normalize(c.email) === id) || (c.phone && c.phone.trim() === identifier.trim())
  ) || null;
}

export function createCustomer({ name, email, phone, password }) {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  if ((email && findByEmailOrPhone(email)) || (phone && findByEmailOrPhone(phone))) {
    throw new Error('An account with this email or phone already exists');
  }
  const customer = {
    id: `cust_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: name || '',
    email: email || '',
    phone: phone || '',
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  const list = loadCustomers();
  list.push(customer);
  saveCustomers(list);
  return customer;
}

export function verifyLogin(identifier, password) {
  const customer = findByEmailOrPhone(identifier);
  if (!customer) return null;
  if (!verifyPasswordHash(password, customer.passwordHash)) return null;
  return customer;
}

export function getCustomerById(id) {
  return loadCustomers().find((c) => c.id === id) || null;
}

/** Strips the password hash before sending a customer object to the browser. */
export function publicCustomer(c) {
  if (!c) return null;
  const { passwordHash, ...rest } = c;
  return rest;
}

// ---------------------------------------------------------------------------
// Cart — stored as an array of { productId, qty } on the customer record.
// This lets the cart survive page refreshes and be shared across devices.
// ---------------------------------------------------------------------------

/** Returns the cart for a customer (empty array if none saved yet). */
export function getCart(customerId) {
  const customer = getCustomerById(customerId);
  if (!customer) return [];
  return Array.isArray(customer.cart) ? customer.cart : [];
}

/**
 * Replaces the entire cart for a customer.
 * items: [{ productId, qty }]
 */
export function setCart(customerId, items) {
  const list = loadCustomers();
  const idx = list.findIndex((c) => c.id === customerId);
  if (idx === -1) throw new Error('Customer not found');
  list[idx] = { ...list[idx], cart: items };
  saveCustomers(list);
  return items;
}

/**
 * Merges a guest cart (from localStorage) into the customer's server cart
 * on login. Server items win on quantity conflicts (server is the truth).
 * Returns the merged cart.
 */
export function mergeCart(customerId, guestItems) {
  const serverCart = getCart(customerId);
  const merged = [...serverCart];
  for (const guestItem of guestItems) {
    const existing = merged.find((i) => i.productId === guestItem.productId);
    if (!existing) {
      merged.push({ productId: guestItem.productId, qty: guestItem.qty });
    }
    // If the item already exists on the server, keep the server quantity
    // (don't blindly overwrite with possibly stale localStorage data)
  }
  return setCart(customerId, merged);
}

// ---------------------------------------------------------------------------
// Password reset — tokens live in memory (cleared on restart, which is fine
// since reset links are short-lived by design). Each token is one-time-use
// and expires in 1 hour.
// ---------------------------------------------------------------------------

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const resetTokens = new Map(); // token -> { customerId, expiresAt }

/**
 * Creates a secure reset token for the customer with the given email.
 * Returns { token, customer } or null if no account found for that email.
 */
export function createResetToken(email) {
  const customer = findByEmailOrPhone(email);
  if (!customer || !customer.email) return null;
  const token = crypto.randomBytes(32).toString('hex');
  resetTokens.set(token, { customerId: customer.id, expiresAt: Date.now() + RESET_TTL_MS });
  return { token, customer };
}

/**
 * Validates a reset token. Returns the customerId if valid, null otherwise.
 * Does NOT consume the token — call consumeResetToken after the password is set.
 */
export function validateResetToken(token) {
  if (!token) return null;
  const entry = resetTokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    resetTokens.delete(token);
    return null;
  }
  return entry.customerId;
}

/**
 * Changes the password for the given customerId and deletes the reset token.
 * Returns true on success.
 */
export function consumeResetToken(token, newPassword) {
  const customerId = validateResetToken(token);
  if (!customerId) return false;
  if (!newPassword || newPassword.length < 6) throw new Error('Password must be at least 6 characters');
  const list = loadCustomers();
  const idx = list.findIndex((c) => c.id === customerId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], passwordHash: hashPassword(newPassword) };
  saveCustomers(list);
  resetTokens.delete(token);
  return true;
}
