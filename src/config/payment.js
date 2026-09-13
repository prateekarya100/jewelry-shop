// ---------------------------------------------------------------------------
// Payment configuration
// ---------------------------------------------------------------------------
// This is a frontend-only demo. Cash on delivery and "scan to pay" (UPI QR)
// work out of the box because they don't need a server. Card payments through
// Razorpay or Stripe are shown as real, wireable integration points — but
// both providers require a backend for a production-safe flow (to create the
// order/paymentIntent and to verify the signature after payment). The notes
// below tell you exactly what to add.

const paymentConfig = {
  // Payee display name shown inside the Razorpay checkout window.
  payeeName: "Priyasa Fashion",

  // Optional backend for production-safe Razorpay payments. When set, the
  // checkout flow asks this server to create the order (with a server-
  // trusted amount) and to verify the payment signature after success —
  // the two things that can't be done safely from the browser alone. Point
  // this at your running server/ folder, e.g. 'http://localhost:4000' while
  // developing, or your deployed backend's URL in production. Leave it
  // empty to fall back to a simpler client-only checkout (fine for local
  // testing, not recommended once real money is involved).
  // backendBaseUrl: "http://localhost:4000", // e.g. 'http://localhost:4000'
  backendBaseUrl: "https://jewelry-shop-p6xg.onrender.com", // e.g. 'http://localhost:4000'

  // Razorpay: paste your Key ID (starts with rzp_test_ or rzp_live_) to enable
  // both the "Scan & pay (UPI)" and "Card / netbanking via Razorpay" buttons.
  // Both open Razorpay's real checkout — UPI shows a live, scannable QR code
  // (this is now the standard UPI experience on desktop web) and Razorpay
  // itself verifies the payment before the `handler` callback fires, so the
  // order confirms automatically and correctly. No manual "I've paid"
  // checkbox, because a plain QR to a personal UPI ID has no way to confirm
  // money actually arrived — Razorpay is what makes automatic confirmation
  // possible at all.
  //
  // This demo works two ways: fully client-side (fine for testing) or, once
  // backendBaseUrl above is set, with real server-side order creation and
  // signature verification via the code in server/ — see server/README.md.
  // razorpayKeyId: "rzp_test_TYIO8WUt0i3W8t", // e.g. 'rzp_test_xxxxxxxxxxxx'
  razorpayKeyId: "rzp_live_TZ8gPh1WrpD8AV", // e.g. 'rzp_live_xxxxxxxxxxxx'

  // Stripe: Stripe's modern Payment Element requires a PaymentIntent created
  // on a backend (never expose your secret key in the browser). Paste your
  // publishable key here once you have a backend endpoint that returns a
  // client secret, and wire it up in components/Checkout.jsx where marked
  // TODO: Stripe.
  stripePublishableKey: "", // e.g. 'pk_test_xxxxxxxxxxxx'
  stripeCreateIntentEndpoint: "", // e.g. 'https://your-api.com/create-payment-intent'
};

export default paymentConfig;
