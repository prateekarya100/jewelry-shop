import { formatINR } from './storage.js';

export function buildShippingText(order) {
  const c = order.customer || {};
  return [
    c.name, c.phone, c.email, c.address,
    [c.city, c.state].filter(Boolean).join(', '),
    c.pincode,
  ].filter(Boolean).join('\n');
}

export function printOrder(order) {
  const c = order.customer || {};
  const win = window.open('', '_blank', 'width=640,height=760');
  if (!win) return;
  const itemsHtml = order.items
    .map((i) => `<tr><td>${i.title}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">${formatINR(i.unitPrice * i.qty)}</td></tr>`)
    .join('');
  win.document.write(`<!doctype html><html><head><title>${order.id}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:28px;color:#241a1f;}
      h2{margin:0 0 4px;} .muted{color:#666;font-size:13px;margin-bottom:18px;}
      table{width:100%;border-collapse:collapse;margin:14px 0;}
      th,td{padding:7px 6px;border-bottom:1px solid #e2ddd8;font-size:14px;text-align:left;}
      .total{font-size:16px;font-weight:bold;text-align:right;margin-top:8px;}
      .section-title{font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#8f5630;margin:18px 0 4px;}
    </style></head><body>
    <h2>Order ${order.id}</h2>
    <div class="muted">${new Date(order.date).toLocaleString()}</div>
    <div class="section-title">Ship to</div>
    <div>${[c.name, c.phone, c.email, c.address, [c.city, c.state].filter(Boolean).join(', '), c.pincode].filter(Boolean).join('<br/>')}</div>
    <div class="section-title">Items</div>
    <table><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Amount</th></tr>${itemsHtml}</table>
    <div class="total">Total: ${formatINR(order.total)}</div>
    <div class="muted">Payment: ${order.paymentMethod.toUpperCase()}${order.paymentRef ? ` (${order.paymentRef})` : ''}</div>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

export function downloadOrder(order) {
  const lines = [
    `Order ${order.id}`,
    new Date(order.date).toLocaleString(),
    '',
    'Ship to:',
    buildShippingText(order),
    '',
    'Items:',
    ...order.items.map((i) => `  ${i.title} x${i.qty} — ${formatINR(i.unitPrice * i.qty)}`),
    '',
    `Total: ${formatINR(order.total)}`,
    `Payment: ${order.paymentMethod.toUpperCase()}${order.paymentRef ? ` (${order.paymentRef})` : ''}`,
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${order.id}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
