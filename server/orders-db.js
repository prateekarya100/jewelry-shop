import { query, withTransaction } from './db.js';
import { decrementStockForOrder, restoreStockForOrder } from './products.js';

/** Professional, readable, sortable order IDs — e.g. ORD2509054821. */
export function generateOrderId() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `ORD${y}${m}${day}${seq}`;
}

function toApiShape(row, items) {
  return {
    id: row.id,
    customerId: row.user_id,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      address: row.customer_address,
      city: row.customer_city,
      state: row.customer_state,
      pincode: row.customer_pincode,
    },
    paymentMethod: row.payment_method,
    paymentRef: row.payment_ref,
    status: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    total: Number(row.total),
    date: row.created_at,
    items: items.map((i) => ({
      productId: i.product_id, title: i.title, qty: i.qty, unitPrice: Number(i.unit_price),
    })),
  };
}

export async function addOrder({ id, userId, customer, paymentMethod, paymentRef, status, fulfillmentStatus, total, items }) {
  const orderId = id || generateOrderId();

  // Everything below happens as one atomic transaction: if stock runs out
  // partway through a multi-item order, NOTHING is saved — no order, no
  // order items, no stock deducted. This is also what safely handles two
  // customers trying to buy the last unit of something at the same moment.
  await withTransaction(async (client) => {
    await decrementStockForOrder(client, items);

    await client.query(
      `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, customer_address,
         customer_city, customer_state, customer_pincode, payment_method, payment_ref, payment_status,
         fulfillment_status, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (id) DO NOTHING`,
      [
        orderId, userId || null, customer.name, customer.email || null, customer.phone || null,
        customer.address || null, customer.city || null, customer.state || null, customer.pincode || null,
        paymentMethod, paymentRef || null, status, fulfillmentStatus || 'confirmed', total,
      ]
    );
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, title, qty, unit_price) VALUES ($1,$2,$3,$4,$5)`,
        [orderId, item.productId, item.title, item.qty, item.unitPrice]
      );
    }
  });

  return getOrderById(orderId);
}

export async function getOrderById(id) {
  const { rows } = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
  if (!rows[0]) return null;
  const { rows: items } = await query(`SELECT * FROM order_items WHERE order_id = $1`, [id]);
  return toApiShape(rows[0], items);
}

export async function updateOrderStatus(id, fulfillmentStatus) {
  return withTransaction(async (client) => {
    const { rows: existingRows } = await client.query('SELECT fulfillment_status FROM orders WHERE id = $1', [id]);
    if (!existingRows[0]) return null;
    const wasAlreadyCancelled = existingRows[0].fulfillment_status === 'cancelled';

    const { rows } = await client.query(
      `UPDATE orders SET fulfillment_status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [fulfillmentStatus, id]
    );
    const { rows: items } = await client.query(`SELECT * FROM order_items WHERE order_id = $1`, [id]);

    // Restore stock exactly once, only on the transition INTO cancelled —
    // never twice if an order is somehow cancelled more than once, and
    // never on any other status change.
    if (fulfillmentStatus === 'cancelled' && !wasAlreadyCancelled) {
      await restoreStockForOrder(client, items.map((i) => ({ productId: i.product_id, qty: i.qty })));
    }

    return toApiShape(rows[0], items);
  });
}

export async function getAllOrders() {
  const { rows: orders } = await query(`SELECT * FROM orders ORDER BY created_at DESC`);
  const { rows: allItems } = await query(`SELECT * FROM order_items`);
  const itemsByOrder = {};
  for (const item of allItems) {
    (itemsByOrder[item.order_id] ||= []).push(item);
  }
  return orders.map((o) => toApiShape(o, itemsByOrder[o.id] || []));
}

/** Orders belonging to a customer — matched by account id, or by phone/email
 * for orders placed as a guest before the account existed. */
export async function getOrdersFor({ userId, phone, email }) {
  const { rows: orders } = await query(
    `SELECT * FROM orders
     WHERE user_id = $1
        OR (customer_phone IS NOT NULL AND customer_phone = $2)
        OR (customer_email IS NOT NULL AND lower(customer_email) = lower($3))
     ORDER BY created_at DESC`,
    [userId || null, phone || null, email || null]
  );
  const { rows: allItems } = await query(`SELECT * FROM order_items`);
  const itemsByOrder = {};
  for (const item of allItems) {
    (itemsByOrder[item.order_id] ||= []).push(item);
  }
  return orders.map((o) => toApiShape(o, itemsByOrder[o.id] || []));
}
