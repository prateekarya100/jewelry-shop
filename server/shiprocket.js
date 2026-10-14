/**
 * ShipRocket Integration with Test/Production Mode Support
 *
 * This module provides a safe way to test ShipRocket integration without
 * creating real shipments that trigger actual pickups. Set SHIPROCKET_MODE
 * to "test" during development to get mock responses.
 */

const SHIPROCKET_MODE = process.env.SHIPROCKET_MODE || "test";
const SHIPROCKET_API_EMAIL = process.env.SHIPROCKET_API_EMAIL || null;
const SHIPROCKET_API_PASSWORD = process.env.SHIPROCKET_API_PASSWORD || null;
const SHIPROCKET_API_BASE =
  process.env.SHIPROCKET_API_URL || "https://apiv2.shiprocket.in";

// Token cache for live mode
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get or refresh ShipRocket auth token (live mode only)
 */
async function getShipRocketToken() {
  if (!SHIPROCKET_API_EMAIL || !SHIPROCKET_API_PASSWORD) {
    throw new Error(
      "SHIPROCKET_API_EMAIL and SHIPROCKET_API_PASSWORD not configured in .env",
    );
  }

  // Return cached token if still valid (8 hour TTL, refresh at 7 hours)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 3600000) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: SHIPROCKET_API_EMAIL,
        password: SHIPROCKET_API_PASSWORD,
      }),
    });

    if (!response.ok) {
      throw new Error(`ShipRocket auth failed: ${response.status}`);
    }

    const data = await response.json();
    cachedToken = data.token;
    tokenExpiry = Date.now() + 8 * 3600000; // 8 hours
    return cachedToken;
  } catch (err) {
    console.error("Failed to get ShipRocket token:", err);
    throw err;
  }
}

/**
 * Create a shipment on ShipRocket
 * Returns: { success, shipment_id, awb_code, courier_name, is_test }
 */
export async function createShipment(orderData) {
  // Test mode: return mock response
  if (SHIPROCKET_MODE === "test") {
    const mockAwb = `TEST_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const mockShipmentId = Math.floor(Math.random() * 9000000) + 1000000;

    return {
      success: true,
      shipment_id: mockShipmentId,
      awb_code: mockAwb,
      courier_name: "TEST_COURIER",
      is_test: true,
    };
  }

  // Live mode: call actual ShipRocket API
  if (SHIPROCKET_MODE !== "live") {
    throw new Error(
      `Invalid SHIPROCKET_MODE: ${SHIPROCKET_MODE}. Use "test" or "live".`,
    );
  }

  try {
    const token = await getShipRocketToken();

    const payload = {
      order_id: orderData.order_id,
      order_date:
        orderData.order_date || new Date().toISOString().split("T")[0],
      pickup_location_id: orderData.pickup_location_id || 1,
      channel_id: orderData.channel_id || 1,
      comment: orderData.comment || "Order created via admin panel",
      billing_customer_name: orderData.customer_name,
      billing_email: orderData.customer_email,
      billing_phone: orderData.customer_phone,
      billing_address: orderData.customer_address,
      billing_city: orderData.customer_city,
      billing_state: orderData.customer_state,
      billing_country: "India",
      billing_pincode: orderData.customer_pincode,
      shipping_is_billing: true,
      order_items: (orderData.items || []).map((item) => ({
        name: item.title,
        sku: item.productId,
        units: item.qty,
        selling_price: item.unitPrice,
      })),
      payment_method: orderData.payment_method || "cod",
      sub_total: orderData.total,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    const response = await fetch(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        `ShipRocket API error: ${result.message || "Unknown error"}`,
      );
    }

    return {
      success: true,
      shipment_id: result.shipment_id,
      awb_code: result.awb_code,
      courier_name: result.courier_name || "UNKNOWN",
      is_test: false,
    };
  } catch (err) {
    console.error("Failed to create shipment on ShipRocket:", err);
    throw err;
  }
}

/**
 * Get shipment tracking details
 */
export async function getShipmentTracking(shipmentId) {
  // Test mode: return mock tracking
  if (SHIPROCKET_MODE === "test") {
    return {
      success: true,
      shipment_id: shipmentId,
      status: "in_transit",
      tracking_url: `https://shiprocket.co/tracking/${shipmentId}`,
      is_test: true,
      events: [
        {
          timestamp: new Date().toISOString(),
          status: "Confirmed",
          comment: "Order confirmed",
        },
        {
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: "Packed",
          comment: "Order packed",
        },
        {
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          status: "Shipped",
          comment: "Order shipped",
        },
      ],
    };
  }

  // Live mode
  if (SHIPROCKET_MODE !== "live") {
    throw new Error(`Invalid SHIPROCKET_MODE: ${SHIPROCKET_MODE}`);
  }

  try {
    const token = await getShipRocketToken();

    const response = await fetch(
      `${SHIPROCKET_API_BASE}/shipments/track/shipping-id/${shipmentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Could not fetch tracking: ${data.message}`);
    }

    return {
      success: true,
      shipment_id: shipmentId,
      status: data.tracking_data?.[0]?.status || "unknown",
      tracking_url: `https://shiprocket.co/tracking/${shipmentId}`,
      is_test: false,
      events: data.tracking_data || [],
    };
  } catch (err) {
    console.error("Failed to get tracking info:", err);
    throw err;
  }
}

/**
 * Check if running in test mode
 */
export function isTestMode() {
  return SHIPROCKET_MODE === "test";
}

/**
 * Get current mode
 */
export function getMode() {
  return SHIPROCKET_MODE;
}

/**
 * Cancel a shipment on ShipRocket
 * Returns: { success, message }
 */
export async function cancelShipment(shipmentId) {
  // Test mode: return mock response
  if (SHIPROCKET_MODE === "test") {
    return {
      success: true,
      message: "Shipment cancelled (test mode)",
      is_test: true,
    };
  }

  // Live mode: call actual ShipRocket API
  if (SHIPROCKET_MODE !== "live") {
    throw new Error(
      `Invalid SHIPROCKET_MODE: ${SHIPROCKET_MODE}. Use "test" or "live".`,
    );
  }

  try {
    const token = await getShipRocketToken();

    const response = await fetch(
      `${SHIPROCKET_API_BASE}/shipments/cancel/${shipmentId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `ShipRocket API error: ${result.message || "Failed to cancel shipment"}`,
      );
    }

    return {
      success: true,
      message: result.message || "Shipment cancelled successfully",
      is_test: false,
    };
  } catch (err) {
    console.error("Failed to cancel shipment on ShipRocket:", err);
    throw err;
  }
}
