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
