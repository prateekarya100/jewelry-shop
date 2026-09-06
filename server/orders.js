import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'orders.json');

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]\n', 'utf-8');
}

export function loadOrders() {
  ensureFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

export function saveOrders(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2) + '\n', 'utf-8');
}

/**
 * Professional, readable, sortable order IDs — e.g. ORD2509054821
 * (year, month, day, then a random 4-digit suffix), instead of a raw
 * base36 timestamp. Matches the pattern real storefronts use.
 */
export function generateOrderId() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `ORD${y}${m}${day}${seq}`;
}

/**
 * Records an order sent from the frontend after checkout completes. The
 * frontend already generated an id and saved a local copy (so checkout
 * always works even if this sync fails) — we store it as-is here, keyed
 * by that same id, so both copies agree.
 */
export function addOrder(order) {
  const list = loadOrders();
  const record = {
    fulfillmentStatus: 'confirmed',
    ...order,
    id: order.id || generateOrderId(),
  };
  // Avoid duplicating if this exact order was already synced (e.g. a retry).
  const existingIdx = list.findIndex((o) => o.id === record.id);
  if (existingIdx !== -1) {
    list[existingIdx] = { ...list[existingIdx], ...record };
  } else {
    list.unshift(record);
  }
  saveOrders(list);
  return record;
}

export function updateOrderStatus(id, fulfillmentStatus) {
  const list = loadOrders();
  const idx = list.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], fulfillmentStatus };
  saveOrders(list);
  return list[idx];
}

/** Orders belonging to a customer — matched by account id, or by phone/email
 * for orders placed as a guest before the account existed. */
export function getOrdersFor({ customerId, phone, email }) {
  const list = loadOrders();
  const normEmail = (email || '').trim().toLowerCase();
  return list.filter((o) => {
    if (customerId && o.customerId === customerId) return true;
    const c = o.customer || {};
    if (phone && c.phone && c.phone.trim() === phone.trim()) return true;
    if (normEmail && c.email && c.email.trim().toLowerCase() === normEmail) return true;
    return false;
  });
}
