import nodemailer from 'nodemailer';

const { GMAIL_USER, GMAIL_APP_PASSWORD, FRONTEND_URL = 'http://localhost:5173' } = process.env;

let transporter = null;
if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    // Without these, a blocked or slow SMTP connection (common on free
    // hosting tiers that restrict outbound email) can hang for minutes
    // instead of failing quickly — which is exactly what leaves a "Sending
    // code..." button stuck forever on the frontend.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
} else {
  console.warn(
    '⚠️  GMAIL_USER / GMAIL_APP_PASSWORD are not set — emails will be logged\n' +
    '    to the console instead of actually sent. See server/README.md for\n' +
    '    how to create a Gmail App Password.'
  );
}

async function send({ to, subject, html }) {
  if (!to) return; // e.g. guest checkout with no email given
  if (!transporter) {
    // Strip HTML tags for a readable console fallback, but keep any links
    // separately (they'd otherwise be lost along with the tags) — this is
    // what lets you test password reset, welcome emails, etc. locally
    // without setting up Gmail at all.
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const linksBlock = links.length ? `\nLink(s): ${links.join(', ')}` : '';
    console.log(`\n📧 [Email not sent — no Gmail configured]\nTo: ${to}\nSubject: ${subject}\n${plain}${linksBlock}\n`);
    return;
  }
  try {
    await transporter.sendMail({ from: `"Priyasa Fashion" <${GMAIL_USER}>`, to, subject, html });
  } catch (err) {
    // Email failures should never break the actual action (signup, order,
    // etc.) that triggered them — log and move on.
    console.error(`Failed to send email to ${to}:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// Shared branded template. Table-based layout — Outlook and older clients
// don't render flexbox/grid reliably, tables are still the safest way to
// get a consistent look across every inbox. Colors match the live site's
// palette (dark plum primary, copper secondary, cream background).
// ---------------------------------------------------------------------------

const PRIMARY = '#1c1420';
const CREAM = '#faf1ec';
const COPPER = '#b8703f';
const TEXT = '#241a1f';
const MUTED = '#8a7a80';
const YEAR = new Date().getFullYear();

function wrap(preheader, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Priyasa Fashion</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};font-family:Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(28,20,32,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${PRIMARY};padding:28px 32px;text-align:center;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:${CREAM};letter-spacing:0.02em;">
                Priyasa Fashion
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;color:${TEXT};font-size:15px;line-height:1.65;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${CREAM};padding:24px 32px;text-align:center;border-top:1px solid #efe3da;">
              <p style="margin:0 0 8px;font-size:12.5px;color:${MUTED};">
                Questions about your order? Reply to this email or visit our
                <a href="${FRONTEND_URL}/contact" style="color:${COPPER};text-decoration:none;">Contact page</a>.
              </p>
              <p style="margin:0 0 12px;font-size:12px;color:${MUTED};">
                <a href="${FRONTEND_URL}/shipping-policy" style="color:${MUTED};text-decoration:underline;margin:0 8px;">Shipping</a>
                <a href="${FRONTEND_URL}/refund-policy" style="color:${MUTED};text-decoration:underline;margin:0 8px;">Returns &amp; Refunds</a>
                <a href="${FRONTEND_URL}/privacy-policy" style="color:${MUTED};text-decoration:underline;margin:0 8px;">Privacy</a>
              </p>
              <p style="margin:0;font-size:11.5px;color:${MUTED};">
                © ${YEAR} Priyasa Fashion. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(label, href) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="border-radius:999px;background:${PRIMARY};">
          <a href="${href}" style="display:inline-block;padding:13px 32px;font-size:14px;font-weight:bold;
            color:${CREAM};text-decoration:none;border-radius:999px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

const STATUS_META = {
  pending: { label: 'Pending', color: '#8a7a80' },
  confirmed: { label: 'Confirmed', color: '#4a7a52' },
  shipped: { label: 'Out for delivery', color: COPPER },
  delivered: { label: 'Delivered', color: '#4a7a52' },
  cancelled: { label: 'Cancelled', color: '#7a2036' },
};

// ---------------------------------------------------------------------------
// Individual emails
// ---------------------------------------------------------------------------

export function sendWelcomeEmail(user) {
  return send({
    to: user.email,
    subject: 'Welcome to Priyasa Fashion',
    html: wrap(`Welcome to Priyasa Fashion, ${user.name}`, `
      <p style="margin:0 0 16px;font-size:20px;font-family:Georgia,serif;color:${PRIMARY};">
        Welcome, ${user.name}!
      </p>
      <p style="margin:0 0 8px;">Your account is ready. From now on you can sign in anytime to:</p>
      <ul style="margin:12px 0 8px;padding-left:20px;">
        <li style="margin-bottom:6px;">Track your orders in real time, from any device</li>
        <li style="margin-bottom:6px;">See your full order history in one place</li>
        <li>Check out faster next time</li>
      </ul>
      ${button('Start shopping', FRONTEND_URL)}
      <p style="margin:16px 0 0;font-size:13px;color:${MUTED};">
        If you didn't create this account, you can safely ignore this email.
      </p>
    `),
  });
}

export function sendOtpEmail(email, otp) {
  return send({
    to: email,
    subject: `${otp} is your Priyasa Fashion verification code`,
    html: wrap(`Your verification code is ${otp}`, `
      <p style="margin:0 0 16px;font-size:20px;font-family:Georgia,serif;color:${PRIMARY};">
        Verify your email
      </p>
      <p style="margin:0 0 20px;">Enter this code to finish creating your account. It expires in <strong>10 minutes</strong>.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding:20px 0;">
            <span style="display:inline-block;font-size:34px;font-weight:bold;letter-spacing:10px;
              color:${PRIMARY};background:${CREAM};padding:16px 28px;border-radius:10px;">
              ${otp}
            </span>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:${MUTED};">
        If you didn't request this, you can safely ignore this email — no account will be created.
      </p>
    `),
  });
}

export function sendPasswordResetEmail(user, resetToken) {
  const link = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
  return send({
    to: user.email,
    subject: 'Reset your Priyasa Fashion password',
    html: wrap('Reset your password', `
      <p style="margin:0 0 16px;font-size:20px;font-family:Georgia,serif;color:${PRIMARY};">
        Reset your password
      </p>
      <p style="margin:0;">We received a request to reset your password. Click below to choose a new one — this link expires in <strong>1 hour</strong>.</p>
      ${button('Reset password', link)}
      <p style="margin:16px 0 0;font-size:13px;color:${MUTED};">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>
    `),
  });
}

export function sendOrderConfirmationEmail(order) {
  const itemRows = order.items.map((i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0e6de;font-size:14px;">${i.title}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0e6de;font-size:14px;text-align:center;color:${MUTED};">× ${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0e6de;font-size:14px;text-align:right;font-weight:bold;">
        ₹${(i.unitPrice * i.qty).toLocaleString('en-IN')}
      </td>
    </tr>`).join('');

  const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentMethod.toUpperCase();

  return send({
    to: order.customer.email,
    subject: `Order confirmed — ${order.id}`,
    html: wrap(`Your order ${order.id} is confirmed`, `
      <p style="margin:0 0 16px;font-size:20px;font-family:Georgia,serif;color:${PRIMARY};">
        Thank you, ${order.customer.name.split(' ')[0]}!
      </p>
      <p style="margin:0 0 20px;">Your order has been confirmed and we're getting it ready.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${CREAM};border-radius:10px;padding:16px 20px;margin-bottom:20px;">
        <tr>
          <td style="font-size:13px;color:${MUTED};padding-bottom:4px;">Order number</td>
        </tr>
        <tr>
          <td style="font-size:16px;font-weight:bold;color:${PRIMARY};">${order.id}</td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
        ${itemRows}
        <tr>
          <td colspan="2" style="padding:14px 0 0;font-size:15px;font-weight:bold;">Total</td>
          <td style="padding:14px 0 0;font-size:16px;font-weight:bold;text-align:right;color:${PRIMARY};">
            ₹${Number(order.total).toLocaleString('en-IN')}
          </td>
        </tr>
      </table>

      <p style="margin:16px 0 0;font-size:13.5px;color:${MUTED};">
        Payment method: <strong style="color:${TEXT};">${paymentLabel}</strong>
      </p>

      ${button('Track your order', `${FRONTEND_URL}/account`)}
    `),
  });
}

export function sendOrderStatusEmail(order, newStatus) {
  const meta = STATUS_META[newStatus] || { label: newStatus, color: PRIMARY };
  const email = order.customer_email || order.customer?.email;

  return send({
    to: email,
    subject: `Order ${order.id} — ${meta.label}`,
    html: wrap(`Your order ${order.id} is now ${meta.label}`, `
      <p style="margin:0 0 16px;font-size:20px;font-family:Georgia,serif;color:${PRIMARY};">
        Your order status has changed
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${CREAM};border-radius:10px;padding:20px;margin:16px 0;">
        <tr>
          <td style="font-size:13px;color:${MUTED};padding-bottom:6px;">Order ${order.id}</td>
        </tr>
        <tr>
          <td>
            <span style="display:inline-block;font-size:16px;font-weight:bold;color:#ffffff;
              background:${meta.color};padding:6px 16px;border-radius:999px;">
              ${meta.label}
            </span>
          </td>
        </tr>
      </table>
      ${button('View order details', `${FRONTEND_URL}/account`)}
    `),
  });
}
