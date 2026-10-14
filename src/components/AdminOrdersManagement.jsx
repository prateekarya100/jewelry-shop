import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  LocalShipping as ShippingIcon,
  Close as CancelIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import paymentConfig from "../config/payment.js";

const AdminOrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openShipmentDialog, setOpenShipmentDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${paymentConfig.backendBaseUrl}/api/admin/orders`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("priyasafashion_customer_token")}`,
          },
        }
      );
      const data = await response.json();
      console.log("✅ Orders fetched:", data);
      setOrders(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  // Check if shipment can be created
  const canCreateShipment = (order) => {
    if (!order) return false;
    const hasNoShipment = !order.shipmentId;
    const isNotCancelled = order.fulfillmentStatus !== "cancelled";
    const canCreate = hasNoShipment && isNotCancelled;
    
    console.log(`📦 Order ${order.id}: shipmentId=${order.shipmentId}, status=${order.fulfillmentStatus}, canCreate=${canCreate}`);
    return canCreate;
  };

  // Create shipment
  const handleCreateShipment = async () => {
    if (!selectedOrder) {
      setError("❌ No order selected");
      return;
    }

    setShipmentLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log(`🚀 Creating shipment for order: ${selectedOrder.id}`);
      const response = await fetch(
        `${paymentConfig.backendBaseUrl}/api/admin/orders/${selectedOrder.id}/create-shipment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("priyasafashion_customer_token")}`,
          },
        }
      );

      const data = await response.json();
      console.log("📝 Response:", data);

      if (response.ok) {
        const shipment = data.shipment || data;
        const testLabel = shipment.is_test ? " (🧪 TEST)" : "";
        setSuccess(
          `✅ Shipment created!${testLabel}\nAWB: ${shipment.awb_code}`
        );

        // Update order in list
        const updatedOrder = data.order || selectedOrder;
        setOrders(
          orders.map((order) =>
            order.id === selectedOrder.id ? updatedOrder : order
          )
        );

        // Update selected order
        setSelectedOrder(updatedOrder);

        // Close dialog after 3 seconds
        setTimeout(() => {
          setOpenShipmentDialog(false);
        }, 3000);
      } else {
        setError(`❌ Failed: ${data.message || data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      setError(`❌ Error: ${err.message}`);
    } finally {
      setShipmentLoading(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    setCancelLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${paymentConfig.backendBaseUrl}/api/admin/orders/${selectedOrder.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("priyasafashion_customer_token")}`,
          },
          body: JSON.stringify({ fulfillmentStatus: "cancelled" }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("✅ Order cancelled successfully!");

        const updatedOrder = data;
        setOrders(
          orders.map((order) =>
            order.id === selectedOrder.id ? updatedOrder : order
          )
        );

        setSelectedOrder(updatedOrder);

        setTimeout(() => {
          setOpenCancelDialog(false);
        }, 2000);
      } else {
        setError(
          `❌ Failed: ${data.message || data.error || "Failed to cancel"}`
        );
      }
    } catch (err) {
      console.error("❌ Cancel error:", err);
      setError(`❌ Error: ${err.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      confirmed: "info",
      "confirmed-cod": "info",
      packed: "warning",
      shipped: "success",
      in_transit: "info",
      out_for_delivery: "primary",
      delivered: "success",
      cancelled: "error",
    };
    return colors[status] || "default";
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.fulfillmentStatus === filterStatus;
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Refresh */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
            📋 Manage Orders
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View, create shipments, and track orders
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchOrders}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, whiteSpace: "pre-line" }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3, whiteSpace: "pre-line" }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              placeholder="Search by Order ID, Customer name, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Filter by Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">All Orders</option>
              <option value="confirmed">Confirmed</option>
              <option value="confirmed-cod">Confirmed (COD)</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Alert severity="info">No orders found</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Total</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Shipment</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {order.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {order.customer?.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {order.customer?.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      ₹{parseFloat(order.total).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Chip
                        label={
                          order.fulfillmentStatus?.toUpperCase() || "PENDING"
                        }
                        color={getStatusColor(order.fulfillmentStatus)}
                        size="small"
                      />
                      {order.isTest && (
                        <Chip
                          label="🧪 TEST"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {order.shipmentId ? (
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: "bold", color: "green" }}
                        >
                          ✅ {order.awbCode}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ display: "block" }}
                        >
                          ID: {order.shipmentId}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="error">
                        ❌ Not created
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(order.date)}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => {
                        console.log("👁️ Viewing order:", order.id);
                        setSelectedOrder(order);
                        setOpenViewDialog(true);
                      }}
                      title="View Details"
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    {canCreateShipment(order) && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          console.log("🚚 Creating shipment for:", order.id);
                          setSelectedOrder(order);
                          setOpenShipmentDialog(true);
                        }}
                        title="Create Shipment"
                      >
                        <ShippingIcon fontSize="small" />
                      </IconButton>
                    )}
                    {order.fulfillmentStatus !== "cancelled" &&
                      order.fulfillmentStatus !== "delivered" && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedOrder(order);
                            setOpenCancelDialog(true);
                          }}
                          title="Cancel Order"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Order Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>📦 Order Details</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedOrder && (
            <Box>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Order ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {selectedOrder.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Status
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                        <Chip
                          label={selectedOrder.fulfillmentStatus?.toUpperCase()}
                          color={getStatusColor(selectedOrder.fulfillmentStatus)}
                          size="small"
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        👤 Customer Details
                      </Typography>
                      <Typography variant="body2">
                        <strong>{selectedOrder.customer?.name}</strong>
                      </Typography>
                      <Typography variant="body2">
                        {selectedOrder.customer?.email}
                      </Typography>
                      <Typography variant="body2">
                        {selectedOrder.customer?.phone}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {selectedOrder.customer?.address}
                      </Typography>
                      <Typography variant="body2">
                        {selectedOrder.customer?.city},{" "}
                        {selectedOrder.customer?.state}{" "}
                        {selectedOrder.customer?.pincode}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Total Amount
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        ₹{parseFloat(selectedOrder.total).toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Payment Method
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {selectedOrder.paymentMethod?.toUpperCase()}
                      </Typography>
                    </Grid>

                    {/* Shipment Section */}
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        🚚 Shipment Details
                      </Typography>
                      {selectedOrder.shipmentId ? (
                        <>
                          <Typography variant="body2">
                            <strong>Shipment ID:</strong>{" "}
                            {selectedOrder.shipmentId}
                          </Typography>
                          <Typography variant="body2">
                            <strong>AWB Code:</strong> {selectedOrder.awbCode}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Courier:</strong> {selectedOrder.carrier}
                          </Typography>
                          {selectedOrder.trackingUrl && (
                            <Button
                              size="small"
                              href={selectedOrder.trackingUrl}
                              target="_blank"
                              sx={{ mt: 1 }}
                            >
                              📍 Track Order
                            </Button>
                          )}
                        </>
                      ) : (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          No shipment created yet
                        </Alert>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedOrder && canCreateShipment(selectedOrder) && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setOpenViewDialog(false);
                setOpenShipmentDialog(true);
              }}
              startIcon={<ShippingIcon />}
            >
              Create Shipment
            </Button>
          )}
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Shipment Dialog */}
      <Dialog
        open={openShipmentDialog}
        onClose={() => !shipmentLoading && setOpenShipmentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>🚚 Create Shipment</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedOrder && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Creating shipment for Order <strong>{selectedOrder.id}</strong>
              </Alert>
              <Card>
                <CardContent>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>👤 Customer:</strong> {selectedOrder.customer?.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>💰 Amount:</strong> ₹
                    {parseFloat(selectedOrder.total).toFixed(2)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: "bold" }}
                  >
                    📍 Delivery Address:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", pl: 2 }}
                  >
                    {selectedOrder.customer?.address},<br />
                    {selectedOrder.customer?.city},{" "}
                    {selectedOrder.customer?.state}{" "}
                    {selectedOrder.customer?.pincode}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenShipmentDialog(false)}
            disabled={shipmentLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateShipment}
            disabled={shipmentLoading}
            startIcon={
              shipmentLoading ? (
                <CircularProgress size={20} />
              ) : (
                <ShippingIcon />
              )
            }
          >
            {shipmentLoading ? "Creating..." : "Create Shipment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog
        open={openCancelDialog}
        onClose={() => !cancelLoading && setOpenCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>❌ Cancel Order</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedOrder && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Are you sure you want to cancel Order{" "}
                <strong>{selectedOrder.id}</strong>?
              </Alert>
              {selectedOrder.shipmentId && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  ⚠️ This order has a shipment. The shipment will be
                  automatically cancelled on ShipRocket.
                </Alert>
              )}
              <Card>
                <CardContent>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Customer:</strong> {selectedOrder.customer?.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Amount:</strong> ₹
                    {parseFloat(selectedOrder.total).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: "green" }}>
                    ✅ <strong>Stock will be restored to inventory</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenCancelDialog(false)}
            disabled={cancelLoading}
          >
            Keep Order
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelOrder}
            disabled={cancelLoading}
            startIcon={
              cancelLoading ? <CircularProgress size={20} /> : <CancelIcon />
            }
          >
            {cancelLoading ? "Cancelling..." : "Confirm Cancel"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminOrdersManagement;
