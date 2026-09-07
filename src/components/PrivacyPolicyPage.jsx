import React from 'react';
import PolicyPage from './PolicyPage.jsx';

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage title="Privacy Policy" updated="7 September 2026">
      <p>
        This policy explains what information Priyasa Fashion collects when you use this
        website, why we collect it, and how it's protected.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> name, email and/or phone number, and a securely
          hashed password, if you create an account.
        </li>
        <li>
          <strong>Order details:</strong> shipping address, phone number, and the items you
          order, so we can fulfil and deliver your order.
        </li>
        <li>
          <strong>Payment information:</strong> we never see or store your card number,
          UPI PIN, or netbanking credentials. Payments are handled entirely by Razorpay, a
          licensed payment aggregator — we only receive confirmation that a payment
          succeeded and a reference ID.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <p>
        Solely to process and deliver your orders, respond to support requests, and show
        you your own order history when you're signed in. We do not sell your personal
        information to third parties, and we do not use it for advertising.
      </p>

      <h2>How your information is protected</h2>
      <p>
        Passwords are stored using industry-standard one-way hashing (scrypt) — not as
        plain text, meaning even we cannot see your actual password. Payment details are
        never stored on our servers at all; they're handled directly by Razorpay under
        PCI-DSS compliant infrastructure.
      </p>

      <h2>Data sharing</h2>
      <p>
        We share order and shipping details with our courier partners solely to deliver
        your order, and payment details with Razorpay solely to process payment. We do not
        share your information with anyone else.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request a copy of the personal information we hold about you, ask us to
        correct it, or ask us to delete your account and associated data, by contacting us
        (see our <a href="/contact">Contact page</a>). We'll act on such requests within 30
        days, except where we're required to retain certain records (like order history)
        for tax or legal purposes.
      </p>

      <h2>Cookies</h2>
      <p>
        This site uses your browser's local storage to remember your cart and login
        session — this stays on your device and is not sent to any third party for
        tracking or advertising purposes.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If this policy changes, we'll update the "Last updated" date above. Continued use
        of the site after a change means you accept the updated policy.
      </p>
    </PolicyPage>
  );
}
