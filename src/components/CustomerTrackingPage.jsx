import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  LocalShipping,
  CheckCircle,
  Schedule,
  AssignmentReturn,
  Navigation,
} from "@mui/icons-material";

const CustomerTrackingPage = () => {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Shipment lifecycle steps
  const steps = [
    { label: "Order Confirmed", icon: Schedule },
    { label: "Packed", icon: AssignmentReturn },
    { label: "Shipped", icon: LocalShipping },
    { label: "In Transit", icon: Navigation },
    { label: "Out for Delivery", icon: LocalShipping },
    { label: "Delivered", icon: CheckCircle },
  ];

  // Mock status mapping (in real scenario, comes from ShipRocket API)
  const getShipmentStatus = (fulfillmentStatus) => {
    const statusMap = {
      confirmed: 0,
      packed: 1,
      shipped: 2,
      in_transit: 3,
      out_for_delivery: 4,
      delivered: 5,
    };
    return statusMap[fulfillmentStatus] || 0;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError("Please enter Order ID");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId.trim()}/tracking`,
      );
      const data = await response.json();

      if (response.ok) {
        // Fetch full order details
        const orderResponse = await fetch(
          `http://localhost:5000/api/orders/${orderId.trim()}`,
        );
        const orderData = await orderResponse.json();

        setOrder({
          ...orderData,
          shipment: data,
        });
      } else {
        setError(data.message || "Order not found");
        setOrder(null);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch tracking information");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: "info",
      packed: "warning",
      shipped: "primary",
      in_transit: "info",
      out_for_delivery: "success",
      delivered: "success",
    };
    return colors[status] || "default";
  };

  const getEstimatedDelivery = () => {
    if (!order) return null;
    const createdDate = new Date(order.created_at);
    const estimatedDate = new Date(createdDate);
    estimatedDate.setDate(estimatedDate.getDate() + 5); // 5 days estimated
    return estimatedDate;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
          📦 Track Your Order
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Enter your Order ID to track delivery status in real-time
        </Typography>
      </Box>

      {/* Search Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSearch}>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Order ID"
              placeholder="e.g., ORD2510135789"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              variant="outlined"
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ px: 4 }}
            >
              {loading ? <CircularProgress size={24} /> : "Track"}
            </Button>
          </Box>
        </form>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Order Not Found Message */}
      {searched && !order && !loading && (
        <Alert severity="info" sx={{ mb: 4 }}>
          Order ID "{orderId}" not found. Please check and try again.
        </Alert>
      )}

      {/* Order Details & Tracking */}
      {order && (
        <>
          {/* Order Summary Card */}
          <Card sx={{ mb: 4, borderTop: "4px solid #1976d2" }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Order ID
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {order.id}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Order Date
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {formatDate(order.created_at)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Total Amount
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      ₹{parseFloat(order.total).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Status
                    </Typography>
                    <Chip
                      label={
                        order.fulfillment_status?.toUpperCase() || "PENDING"
                      }
                      color={getStatusColor(order.fulfillment_status)}
                      sx={{ mt: 0.5, fontWeight: "bold" }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Shipment Details */}
          {order.shipment && order.shipment.shipment_id ? (
            <Card sx={{ mb: 4, backgroundColor: "#f5f5f5" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  📤 Shipment Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Shipment ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {order.shipment.shipment_id}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        AWB Code
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {order.shipment.awb_code}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      href={order.shipment.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Track on ShipRocket 🚀
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Alert severity="warning" sx={{ mb: 4 }}>
              ⏳ Shipment not yet created. Your order is being processed.
            </Alert>
          )}

          {/* Delivery Timeline */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                📍 Delivery Timeline
              </Typography>
              <Stepper
                activeStep={getShipmentStatus(order.fulfillment_status)}
                orientation="vertical"
              >
                {steps.map((step, index) => (
                  <Step
                    key={index}
                    completed={
                      index <= getShipmentStatus(order.fulfillment_status)
                    }
                  >
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>

          {/* Delivery Estimate */}
          <Card sx={{ mb: 4, backgroundColor: "#e8f5e9" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                📅 Estimated Delivery
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1">
                Expected delivery by{" "}
                <strong>{formatDate(getEstimatedDelivery())}</strong>
              </Typography>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: "block", mt: 1 }}
              >
                *Delivery timeframe may vary based on location and courier
                availability
              </Typography>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                📍 Delivery Address
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2">
                <strong>{order.customer_name}</strong>
              </Typography>
              <Typography variant="body2">{order.customer_address}</Typography>
              <Typography variant="body2">
                {order.customer_city}, {order.customer_state}{" "}
                {order.customer_pincode}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Phone:</strong> {order.customer_phone}
              </Typography>
            </CardContent>
          </Card>

          {/* Support */}
          <Box
            sx={{ mt: 4, p: 3, backgroundColor: "#f5f5f5", borderRadius: 1 }}
          >
            <Typography variant="body2" color="textSecondary">
              Need help? Contact us at{" "}
              <strong>support@priyasafashion.com</strong> or call{" "}
              <strong>+91-9650841442</strong>
            </Typography>
          </Box>
        </>
      )}
    </Container>
  );
};

export default CustomerTrackingPage;
