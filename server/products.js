import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.join(__dirname, 'data', 'products.json');

// Products now live in the database — this is the single source of truth
// both the storefront (GET /api/products) and the payment amount
// calculation below read from, so an edit made in the Admin Dashboard is
// reflected everywhere immediately, on every device, with nothing to keep
// in sync by hand.

function toApiShape(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    tagline: row.tagline || '',
    description: row.description || '',
    price: Number(row.price),
    discount: Number(row.discount),
    images: row.images || [],
    video: row.video || '',
    material: row.material || '',
    stock: row.stock,
  };
}

/**
 * Runs once, automatically, right after the schema is created — if the
 * products table is empty (a brand-new database), it's seeded from
 * server/data/products.json so your existing catalogue isn't lost when
 * moving from the old JSON-file storage to the database. On every later
 * startup this is a no-op, since the table won't be empty anymore.
 */
export async function seedFromJsonIfEmpty() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM products');
  if (rows[0].count > 0) return;
  if (!fs.existsSync(SEED_FILE)) return;

  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
  for (const p of seed) {
    await query(
      `INSERT INTO products (id, title, category, tagline, description, price, discount, images, video, material, stock)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.title, p.category, p.tagline || '', p.description || '', p.price, p.discount || 0,
       p.images || [], p.video || '', p.material || '', p.stock || 0]
    );
  }
  console.log(`✅ Seeded ${seed.length} products from products.json into the database`);
}

export async function loadProducts() {
  const { rows } = await query('SELECT * FROM products ORDER BY created_at DESC');
  return rows.map(toApiShape);
}

export async function getProduct(id) {
  const { rows } = await query('SELECT * FROM products WHERE id = $1', [id]);
  return rows[0] ? toApiShape(rows[0]) : null;
}

function generateProductId() {
  return `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function addProduct(product) {
  const id = generateProductId();
  const { rows } = await query(
    `INSERT INTO products (id, title, category, tagline, description, price, discount, images, video, material, stock)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [id, product.title, product.category, product.tagline || '', product.description || '',
     product.price, product.discount || 0, product.images || [], product.video || '',
     product.material || '', product.stock || 0]
  );
  return toApiShape(rows[0]);
}

export async function updateProduct(id, patch) {
  const existing = await getProduct(id);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  const { rows } = await query(
    `UPDATE products SET title=$1, category=$2, tagline=$3, description=$4, price=$5,
       discount=$6, images=$7, video=$8, material=$9, stock=$10
     WHERE id=$11 RETURNING *`,
    [merged.title, merged.category, merged.tagline, merged.description, merged.price,
     merged.discount, merged.images, merged.video, merged.material, merged.stock, id]
  );
  return rows[0] ? toApiShape(rows[0]) : null;
}

export async function deleteProduct(id) {
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [id]);
  return rowCount > 0;
}

/**
 * Computes the authoritative order total from the server's own product
 * prices, given only { productId, qty } pairs from the browser. This is
 * what actually stops a customer from tampering with the price in devtools
 * before paying — the browser's number is never trusted here.
 */
export async function computeAmount(items) {
  let total = 0;
  for (const item of items) {
    const qty = Math.max(1, Number(item.qty) || 1);
    const product = await getProduct(item.productId);
    if (!product) {
      throw new Error(`Unknown product: ${item.productId}`);
    }
    const unitPrice = Math.round(product.price * (1 - (product.discount || 0) / 100));
    total += unitPrice * qty;
  }
  return total;
}

/**
 * Atomically deducts stock for every item in an order, all-or-nothing. Runs
 * inside the same database transaction as the order itself (see
 * orders-db.js addOrder), so if any single item doesn't have enough stock,
 * the whole order is rolled back — no partial order, no partial deduction.
 *
 * The `WHERE stock >= $qty` clause (not just `WHERE id = $id`) is what makes
 * this safe against two customers checking out the last item at the same
 * moment — the database itself guarantees only one of them can succeed.
 */
export async function decrementStockForOrder(client, items) {
  for (const item of items) {
    const qty = Math.max(1, Number(item.qty) || 1);
    const { rows } = await client.query(
      `UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING title, stock`,
      [qty, item.productId]
    );
    if (rows.length === 0) {
      // Either the product doesn't exist, or there isn't enough stock left.
      const { rows: existing } = await client.query('SELECT title, stock FROM products WHERE id = $1', [item.productId]);
      const title = existing[0]?.title || item.productId;
      const available = existing[0]?.stock ?? 0;
      throw new Error(`Not enough stock for "${title}" — only ${available} left, but ${qty} were requested.`);
    }
  }
}

/** Restores stock for every item in an order — used when an order is
 * cancelled, so the items become available to other customers again. */
export async function restoreStockForOrder(client, items) {
  for (const item of items) {
    const qty = Math.max(1, Number(item.qty) || 1);
    await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [qty, item.productId]);
  }
}
