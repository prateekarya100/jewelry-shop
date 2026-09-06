# Priyasa Fashion backend

An Express server with three jobs:

1. **Own the product catalogue** (`server/data/products.json`) — the
   single source of truth the storefront reads from and the Admin
   Dashboard edits. This is what closes the "I changed the price but
   payments still show the old amount" problem: there's only one copy of
   prices now, not one in the browser and one on the server.
2. **Authenticate the admin** — a simple username/password login backed
   by an in-memory session token (see `auth.js`).
3. **Create and verify Razorpay payments** — computing the amount from its
   own product data (never trusting a total sent from the browser) and
   verifying the payment signature after success.

## Run it locally

```bash
cd server
npm install
cp .env.example .env
```

Fill in `.env`:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=priyasa2026   # change this before deploying anywhere public
```

Then:

```bash
npm run dev
```

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/products` | none | Storefront catalogue |
| POST | `/api/admin/login` | none | `{ username, password }` → `{ token }` |
| POST | `/api/admin/logout` | Admin token | Ends the session |
| POST | `/api/admin/products` | Admin token | Add a product |
| PUT | `/api/admin/products/:id` | Admin token | Edit a product |
| DELETE | `/api/admin/products/:id` | Admin token | Remove a product |
| GET | `/api/admin/orders` | Admin token | Every order, from every customer |
| PUT | `/api/admin/orders/:id/status` | Admin token | Change delivery status |
| POST | `/api/customer/register` | none | `{ name, email, phone, password }` → `{ token, customer }` |
| POST | `/api/customer/login` | none | `{ identifier, password }` → `{ token, customer }` |
| POST | `/api/customer/logout` | Customer token | Ends the session |
| GET | `/api/customer/me` | Customer token | Current account info |
| POST | `/api/orders` | Optional customer token | Records an order after checkout (guest or logged-in) |
| GET | `/api/customer/orders` | Customer token | That customer's own order history |
| POST | `/api/create-order` | none | Creates a Razorpay order, server-computed amount |
| POST | `/api/verify-payment` | none | Verifies a Razorpay payment signature |

## The product data file

`server/data/products.json` is a plain JSON array, safe to hand-edit if
you ever need to (stop the server first, or re-save after). Every field
matches what the Admin Dashboard's product form collects: `title`,
`category`, `tagline`, `description`, `price`, `discount`, `images`
(array of URLs), `video`, `material`, `stock`.

## Deploying

Plain Node/Express — Render or Railway both work well with free tiers:

1. Set the root directory to `server`.
2. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `ADMIN_USERNAME`,
   `ADMIN_PASSWORD`, and `ALLOWED_ORIGINS` (your deployed frontend's URL)
   as environment variables there — never commit `.env`.
3. Update `backendBaseUrl` in the frontend's `src/config/payment.js` to
   this backend's deployed URL.

One thing to know: `server/data/*.json` (products, orders, customers) all
live on the server's filesystem. Most free hosting tiers wipe the
filesystem on redeploy — fine for testing, but before relying on this for
a real store with real customer accounts and order history, ask about
moving to a real database (Postgres, SQLite on a persistent disk, etc.) so
data survives redeploys.
