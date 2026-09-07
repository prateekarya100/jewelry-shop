import React from 'react';
import PolicyPage from './PolicyPage.jsx';

export default function ShippingPolicyPage() {
  return (
    <PolicyPage title="Shipping & Returns" updated="7 September 2026">
      <h2>Processing time</h2>
      <p>
        Orders are processed and handed to our courier partner within 1-2 business days
        of confirmation. You'll see the order move from "Confirmed" to "Out for delivery"
        in your account once it ships — no separate email needed, though we recommend
        checking "My Orders" for the latest status.
      </p>

      <h2>Delivery timelines</h2>
      <ul>
        <li>Metro cities: 3-5 business days from dispatch</li>
        <li>Other locations: 5-8 business days from dispatch</li>
        <li>Cash on delivery orders may take 1 additional day to confirm before dispatch</li>
      </ul>
      <p>
        These are estimates, not guarantees — courier delays outside our control (weather,
        regional disruptions) can occasionally extend them. We'll flag any known delay on
        your order status where possible.
      </p>

      <h2>Shipping charges</h2>
      <p>
        Free on orders over ₹999. Below that threshold, a flat ₹79 shipping fee applies,
        shown clearly at checkout before you pay — never added afterward.
      </p>

      <h2>Returns and exchanges</h2>
      <p>
        If a piece doesn't sit right, you can request an exchange within <strong>7 days</strong> of
        delivery. To start one, contact us (see our <a href="/contact">Contact page</a>) with your
        order ID and the reason for the exchange. We'll share pickup or return-shipping
        instructions within 1 business day of your request.
      </p>
      <p>
        Items must be unworn, undamaged, and returned with their original packaging. For
        hygiene reasons, earrings for pierced ears cannot be exchanged once the seal on the
        packaging has been opened, unless the item arrived damaged or defective.
      </p>

      <h2>Damaged or incorrect items</h2>
      <p>
        If your order arrives damaged, defective, or different from what you ordered,
        contact us within 48 hours of delivery with photos of the item and packaging. We'll
        arrange a replacement or refund at no extra cost to you — see our{' '}
        <a href="/refund-policy">Cancellation & Refund Policy</a> for how refunds are processed.
      </p>
    </PolicyPage>
  );
}
