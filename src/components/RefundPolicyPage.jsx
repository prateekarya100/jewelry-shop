import React from 'react';
import PolicyPage from './PolicyPage.jsx';

export default function RefundPolicyPage() {
  return (
    <PolicyPage title="Cancellation & Refund Policy" updated="7 September 2026">
      <h2>Cancelling an order</h2>
      <p>
        You can cancel an order for free as long as it hasn't yet been marked "Out for
        delivery." Once it has shipped, it can no longer be cancelled — you're welcome to
        request an exchange after delivery instead (see our{' '}
        <a href="/shipping-policy">Shipping & Returns policy</a>).
      </p>
      <p>
        To cancel, contact us (see our <a href="/contact">Contact page</a>) with your order
        ID, or reach out through the same payment method's support channel if you paid via
        Razorpay.
      </p>

      <h2>Refund timelines</h2>
      <ul>
        <li>
          <strong>Prepaid orders (UPI, card, netbanking):</strong> refunded to your original
          payment method within <strong>5-7 business days</strong> of the cancellation or
          approved return being processed.
        </li>
        <li>
          <strong>Cash on delivery orders:</strong> since no payment was collected upfront,
          cancellation before dispatch requires no refund. If you've already paid the
          delivery agent and want to cancel after the fact, we'll process a bank transfer
          refund within <strong>7-10 business days</strong> once you share your bank details.
        </li>
      </ul>
      <p>
        Refund processing times above are what we commit to on our end. Your bank or card
        network may take a few additional days to reflect the amount in your account after
        we initiate it — this part is outside our direct control.
      </p>

      <h2>What's refunded</h2>
      <p>
        The full item price and any shipping fee you paid are refunded for cancellations
        before dispatch, damaged/defective items, and approved exchanges resulting in a
        refund instead of a replacement. For exchanges where you're sent a replacement
        item instead of a refund, no separate refund is issued.
      </p>

      <h2>How refunds are issued</h2>
      <p>
        Refunds for Razorpay payments (UPI, card, netbanking) are issued back to the same
        payment method automatically through Razorpay once we approve the refund — you
        don't need to share any additional details for these. Cash-on-delivery refunds are
        sent via bank transfer, for which we'll ask for your account details separately.
      </p>
    </PolicyPage>
  );
}
