# Priyasa Fashion (React + Vite + MUI + backend)

A full storefront: browse pieces by section, watch a demo video per
product, read/leave reviews, add to bag, and check out with cash, UPI, or
Razorpay. Built on [MUI](https://mui.com) for the UI layer.

## Admin credentials

- URL: click **"Admin sign in"** in the header.
- Username: `admin`
- Password: `priyasa2026`

**Change this password before deploying anywhere public** — see
`server/.env` (`ADMIN_PASSWORD`).

## Architecture, in short

- **Frontend** (`/`): the storefront and Admin Dashboard, a Vite/React app.
- **Backend** (`/server`): a small Express server that is the single
  source of truth for the product catalogue, handles admin login, and
  talks to Razorpay for payments. **The backend must be running for the
  storefront, checkout, and admin login to work** — this project is no
  longer a pure frontend-only demo.
- Cart, reviews, and the local device's order history still live in the
  browser's `localStorage` — only products and payments are backend-backed.

## Run it

Two terminals, both need to stay running:

```bash
# Terminal 1 — backend
cd server
npm install
cp .env.example .env   # then fill in your Razorpay keys
npm run dev
```

```bash
# Terminal 2 — frontend
npm install
npm run dev
```

Open the frontend's printed local URL. Make sure `src/config/payment.js`
has `backendBaseUrl` pointing at the backend (`http://localhost:4000` by
default) and your `razorpayKeyId` filled in.

## Customer accounts

Customers can register (name, email or phone, password) or check out as a
guest. Either way, once they're signed in (via the person icon in the
header), **My Orders** shows their order history with live status — fetched
fresh from the backend every time, so a status change you make in the Admin
Dashboard shows up there immediately, from any device.

Guest orders link automatically: if someone orders without an account, then
later registers with the same phone or email, that earlier order appears in
their account too — matched by contact info, not just account ID.

Order IDs look like `ORD2509054821` (year-month-day + a short suffix) —
readable and sortable, not a raw timestamp string.

## Admin Dashboard

Sign in with the credentials above to reach a dedicated dashboard (not a
popup) with:

- **Overview** — product count, order count, revenue on this device, low
  stock alert.
- **Products** — add, edit, delete products. Edits go straight to the
  backend's `server/data/products.json`, which is also what Razorpay's
  order amount is calculated from — so a price change here is instantly
  correct everywhere, with nothing to manually keep in sync.
- **Orders** — every order from every customer, on any device, with a
  delivery status you set (Pending → Confirmed → Out for delivery →
  Delivered, or Cancelled). Collapsible per order; print or download any
  order's details; filter by date range.

Admin sessions are simple in-memory tokens on the backend (see
`server/auth.js`) — they reset if the backend restarts, and expire after 8
hours either way.

## Payments

- **Cash on delivery** — works immediately.
- **Scan & pay (UPI)** and **Card / netbanking via Razorpay** — both open
  Razorpay's real checkout, with the order created and the payment
  verified by the backend (see `server/README.md`). Requires
  `razorpayKeyId` in `src/config/payment.js` and the backend running.
- **Stripe** — left as a wired-up stub with instructions in
  `Checkout.jsx` (search `TODO: Stripe`), since it needs its own backend
  endpoint to create a PaymentIntent.

## Customizing the look

Colors, typography and component defaults live in `src/theme.js` (an MUI
`createTheme`) — change `palette.primary` / `palette.secondary` there and
it flows through every component.

Image and video alignment is handled by `src/components/AspectMedia.jsx` —
a reusable box that locks any image or embed to a fixed aspect ratio.

## Moving further

Cart, reviews, and per-device order history still live in `localStorage`.
If you want orders visible across devices too (e.g. from your phone as
well as your laptop), the natural next step is moving those into the
backend the same way products were — happy to help when you're ready.
