import React from 'react';
import PolicyPage from './PolicyPage.jsx';

export default function TermsPage() {
  return (
    <PolicyPage title="Terms & Conditions" updated="7 September 2026">
      <p>
        These terms govern your use of the Priyasa Fashion website and any purchase you
        make through it. By placing an order, you agree to the terms below.
      </p>

      <h2>Products and pricing</h2>
      <p>
        All prices are listed in Indian Rupees (INR) and are inclusive of applicable
        taxes unless stated otherwise. We reserve the right to correct pricing errors
        before an order is confirmed; if a price was clearly incorrect, we'll contact you
        before charging or shipping anything.
      </p>

      <h2>Orders and payment</h2>
      <p>
        Orders can be paid for via UPI, card, or netbanking (processed securely through
        Razorpay), or cash on delivery where available. An order is confirmed once payment
        succeeds, or immediately for cash-on-delivery orders. See our{' '}
        <a href="/refund-policy">Cancellation & Refund Policy</a> for how cancellations and
        refunds work.
      </p>

      <h2>Shipping</h2>
      <p>
        Delivery timelines and charges are described in our{' '}
        <a href="/shipping-policy">Shipping & Returns policy</a>. We ship only within
        India at this time.
      </p>

      <h2>Product accuracy</h2>
      <p>
        We photograph and film every piece as accurately as possible, including on real
        hands under natural light, so what you see closely matches what you receive.
        Minor variations in color due to screen display settings are possible and don't
        constitute a defect.
      </p>

      <h2>Account responsibility</h2>
      <p>
        If you create an account, you're responsible for keeping your password
        confidential and for all activity under your account. Contact us immediately if
        you suspect unauthorized access.
      </p>

      <h2>Intellectual property</h2>
      <p>
        All product photography, videos, and written content on this site belong to
        Priyasa Fashion and may not be reused without permission.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        We aim to describe every product accurately and ship every order carefully. To
        the extent permitted by law, our liability for any issue with an order is limited
        to the value of that order — we're not liable for indirect or consequential
        losses.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India. Any disputes will be subject to
        the jurisdiction of the courts in [Your city], India.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Reach us via our <a href="/contact">Contact page</a>.
      </p>
    </PolicyPage>
  );
}
