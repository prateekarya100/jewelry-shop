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
  Tooltip,
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

  // Fetch orders on component mount
  useEffect(() => {
    console.log("🔄 Component mounted, fetching orders...");
    fetchOrders();
  }, []);

  // Fetch all orders from backend
  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    console.log("📡 Fetching orders from API...");
    
    try {
      const token = localStorage.getItem("priyasafashion_customer_token");
      console.log("🔑 Token:", token ? "Present" : "Missing");
      
      const response = await fetch(
        `${paymentConfig.backendBaseUrl}/api/admin/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("✅ Orders received from API:", data);
      console.log(`📊 Total orders: ${Array.isArray(data) ? data.length : 0}`);
      
      // Log each order's shipment status
      if (Array.isArray(data)) {
        data.forEach((order) => {
          console.log(
            `   📦 ${order.id}: shipmentId=${order.shipmentId || "null"}, status=${order.fulfillmentStatus}`
          );
        });
      }
      
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      setError(`Failed to fetch orders: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ CRITICAL FUNCTION: Determine if shipment can be created for an order
  const canCreateShipment = (order) => {
    if (!order) {
      console.warn("⚠️ canCreateShipment called with no order");
      return false;
    }

    const hasNoShipment = !order.shipmentId;
    const isNotCancelled = order.fulfillmentStatus !== "cancelled";
    const result = hasNoShipment && isNotCancelled;

    console.log(
      `🔍 canCreateShipment(${order.id}): shipmentId=${order.shipmentId || "null"}, fulfillmentStatus=${order.fulfillmentStatus}, result=${result}`
    );

    return result;
  };

  // Render action buttons for table row
  const renderActionButtons = (order) => {
    console.log(`🎨 Rendering actions for order ${order.id}`);
    
    const canCreate = canCreateShipment(order);
    console.log(`   canCreate=${canCreate}`);

    return (
      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
        {/* View Button - Always visible */}
        <Tooltip title="View Details">
          <IconButton
            size="small"
            variant="outlined"
            onClick={() => {
              console.log("👁️ Click: View order", order.id);
              setSelectedOrder(order);
              setOpenViewDialog(true);
            }}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Create Shipment Button - ONLY if canCreate is true */}
        {canCreate && (
          <Tooltip title="Create Shipment">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                console.log("🚚 Click: Create shipment for", order.id);
                setSelectedOrder(order);
                setOpenShipmentDialog(true);
              }}
              sx={{
                backgroundColor: "rgba(33, 150, 243, 0.1)",
                "&:hover": {
                  backgroundColor: "rgba(33, 150, 243, 0.2)",
                },
              }}
            >
              <ShippingIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* Cancel Button - if order not cancelled or delivered */}
        {order.fulfillmentStatus !== "cancelled" &&
          order.fulfillmentStatus !== "delivered" && (
            <Tooltip title="Cancel Order">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  console.log("❌ Click: Cancel order", order.id);
                  setSelectedOrder(order);
                  setOpenCancelDialog(true);
                }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
      </Box>
    );
  };

  // Create shipment via API
  const handleCreateShipment = async () => {
    if (!selectedOrder) {
      console.error("❌ No order selected for shipment creation");
      setError("No order selected");
      return;
    }

    setShipmentLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log(`🚀 Creating shipment for order: ${selectedOrder.id}`);
      const token = localStorage.getItem("priyasafashion_customer_token");
      
      const response = await fetch(
        `${paymentConfig.backendBaseUrl}/api/admin/orders/${selectedOrder.id}/create-shipment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log("📝 Create shipment response:", data);

      if (response.ok) {
        const shipment = data.shipment || data;
        const testLabel = shipment.is_test ? " (🧪 TEST)" : "";
        const awbCode = shipment.awb_code || "N/A";
        
        setSuccess(
          `✅ Shipment created successfully!${testLabel}\nAWB Code: ${awbCode}`
        );
        console.log(`✅ Shipment created: AWB=${awbCode}`);

        // Update the order in the list
        const updatedOrder = data.order || selectedOrder;
        console.log("📦 Updated order:", updatedOrder);
        
        setOrders(
          orders.map((ord) =>
            ord.id === selectedOrder.id ? updatedOrder : ord
          )
        );
        setSelectedOrder(updatedOrder);

        // Close dialog after 2 seconds
        setTimeout(() => {
          setOpenShipmentDialog(false);
          fetchOrders(); // Refresh to get latest data
        }, 2000);
      } else {
        const errorMsg = data.message || data.error || "Unknown error";
        console.error("❌ Shipment creation failed:", errorMsg);
        setError(`Failed to create shipment: ${errorMsg}`);
      }
    } catch (err) {
      console.error("❌ Exception during shipment creation:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setShipmentLoading(false);
    }
  };

  // Cancel order via API
  const handleCancelOrder = async () => {
    if (!selectedOrder) {
      console.error("❌ No order selected for cancellation");
      return;
    }

    setCancelLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log(`❌ Cancelling order: ${selectedOrder.id}`);
      const token = localStorage.getItem("priyasafashion_customer_token");
      
      const response = await fetch(
        `${paymentConfig.backendBaseUrl}/api/admin/orders/${selectedOrder.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fulfillmentStatus: "cancelled" }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("✅ Order cancelled successfully!");
        console.log("✅ Order cancelled:", data);

        setOrders(
          orders.map((ord) =>
            ord.id === selectedOrder.id ? data : ord
          )
        );
        setSelectedOrder(data);

        setTimeout(() => {
          setOpenCancelDialog(false);
          fetchOrders();
        }, 2000);
      } else {
        const errorMsg = data.message || data.error || "Failed to cancel";
        console.error("❌ Cancel failed:", errorMsg);
        setError(`Failed to cancel: ${errorMsg}`);
      }
    } catch (err) {
      console.error("❌ Exception during cancellation:", err);
      setError(`Error: ${err.message}`);
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

  // Get status color for chip
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

  // Filter orders based on status and search term
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
      {/* Header */}
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
            View, create shipments, and track customer orders
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchOrders}
          disabled={loading}
        >
          Refresh Orders
        </Button>
      </Box>

      {/* Error & Success Messages */}
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

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              placeholder="Search by Order ID, Name, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
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
              size="small"
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
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Alert severity="info">No orders found</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", width: "12%" }}>
                  Order ID
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: "20%" }}>
                  Customer
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: "8%", textAlign: "right" }}>
                  Total
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: "15%" }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: "20%" }}>
                  Shipment
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: "12%" }}>
                  Date
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold", width: "13%", textAlign: "center" }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} hover sx={{ "&:hover": { backgroundColor: "#fafafa" } }}>
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
                  <TableCell sx={{ textAlign: "right" }}>
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
                          ✅ {order.awbCode || "N/A"}
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
                      <Typography variant="caption" sx={{ color: "red" }}>
                        ❌ Not Created
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDate(order.date)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    {renderActionButtons(order)}
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
                          ⚠️ No shipment created yet
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
        <DialogTitle>🚚 Create Shipment for Order</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedOrder && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Creating shipment for Order <strong>{selectedOrder.id}</strong>
              </Alert>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    Order Summary
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>👤 Customer:</strong> {selectedOrder.customer?.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>📧 Email:</strong> {selectedOrder.customer?.email}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>📞 Phone:</strong> {selectedOrder.customer?.phone}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>💰 Amount:</strong> ₹
                    {parseFloat(selectedOrder.total).toFixed(2)}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    📍 Delivery Address:
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block" }}>
                    {selectedOrder.customer?.address}
                    <br />
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
            color="primary"
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
                  ⚠️ This order has an active shipment which will also be
                  cancelled.
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
                  <Typography variant="body2" sx={{ mt: 2, color: "green" }}>
                    ✅ <strong>Stock will be restored</strong>
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
