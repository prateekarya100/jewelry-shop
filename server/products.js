import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'products.json');

// This file is the single source of truth for product data — both the
// storefront (GET /api/products) and the payment amount calculation below
// read from it, so an edit made in the Admin Dashboard is reflected
// everywhere immediately, with nothing to keep in sync by hand.

export function loadProducts() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

export function saveProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf-8');
}

export function getProduct(id) {
  return loadProducts().find((p) => p.id === id) || null;
}

export function addProduct(product) {
  const products = loadProducts();
  const next = { id: `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, ...product };
  products.unshift(next);
  saveProducts(products);
  return next;
}

export function updateProduct(id, patch) {
  const products = loadProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...patch, id };
  saveProducts(products);
  return products[idx];
}

export function deleteProduct(id) {
  const products = loadProducts();
  const next = products.filter((p) => p.id !== id);
  saveProducts(next);
  return next.length !== products.length;
}

/**
 * Computes the authoritative order total from the server's own product
 * prices, given only { productId, qty } pairs from the browser. This is
 * what actually stops a customer from tampering with the price in devtools
 * before paying — the browser's number is never trusted here.
 */
export function computeAmount(items) {
  const products = loadProducts();
  let total = 0;
  for (const item of items) {
    const qty = Math.max(1, Number(item.qty) || 1);
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error(`Unknown product: ${item.productId}`);
    }
    const unitPrice = Math.round(product.price * (1 - (product.discount || 0) / 100));
    total += unitPrice * qty;
  }
  return total;
}
