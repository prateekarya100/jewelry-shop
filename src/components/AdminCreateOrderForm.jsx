import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Container,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useStore } from "../context/StoreContext.jsx";
import paymentConfig from "../config/payment.js";

const AdminCreateOrderForm = ({ onOrderCreated }) => {
  const { products: storeProducts } = useStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openProductDialog, setOpenProductDialog] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // Cart items
  const [cartItems, setCartItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Fetch available products
  useEffect(() => {
    if (storeProducts && storeProducts.length > 0) {
      setProducts(storeProducts);
    } else {
      fetchProducts();
    }
  }, [storeProducts]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `${paymentConfig.backendBaseUrl}/api/products`,
      );
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to fetch products");
    }
  };

  // Add product to cart
  const handleAddProduct = () => {
    if (!selectedProduct) {
      setError("Please select a product");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const existingItem = cartItems.find((item) => item.id === selectedProduct);

    if (existingItem) {
      // Update quantity
      setCartItems(
        cartItems.map((item) =>
          item.id === selectedProduct
            ? { ...item, qty: item.qty + parseInt(selectedQuantity) }
            : item,
        ),
      );
    } else {
      // Add new item
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          productId: product.id,
          title: product.title,
          price: product.price,
          qty: parseInt(selectedQuantity),
        },
      ]);
    }

    setSelectedProduct("");
    setSelectedQuantity(1);
    setOpenProductDialog(false);
    setError("");
  };

  // Remove product from cart
  const handleRemoveProduct = (productId) => {
    setCartItems(cartItems.filter((item) => item.id !== productId));
  };

  // Calculate total
  const calculateTotal = () => {
    return cartItems
      .reduce((sum, item) => sum + parseFloat(item.price) * item.qty, 0)
      .toFixed(2);
  };

  // Validate form
  const validateForm = () => {
    if (!customerName.trim()) {
      setError("Customer name is required");
      return false;
    }
    if (!customerEmail.trim()) {
      setError("Customer email is required");
      return false;
    }
    if (!customerPhone.trim()) {
      setError("Customer phone is required");
      return false;
    }
    if (!customerAddress.trim()) {
      setError("Customer address is required");
      return false;
    }
    if (!customerCity.trim()) {
      setError("Customer city is required");
      return false;
    }
    if (!customerState.trim()) {
      setError("Customer state is required");
      return false;
    }
    if (!customerPincode.trim()) {
      setError("Customer pincode is required");
      return false;
    }
    if (cartItems.length === 0) {
      setError("Please add at least one product");
      return false;
    }
    return true;
  };

  // Create order
  const handleCreateOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const orderData = {
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address: customerAddress,
          city: customerCity,
          state: customerState,
          pincode: customerPincode,
        },
        paymentMethod: paymentMethod,
        status: paymentMethod === "cod" ? "confirmed-cod" : "pending",
        items: cartItems.map((item) => ({
          productId: item.productId,
          title: item.title,
          qty: item.qty,
          unitPrice: parseFloat(item.price),
        })),
        total: calculateTotal(),
      };

      const response = await fetch(
        `${paymentConfig.backendBaseUrl}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("priyasafashion_admin_token")}`,
          },
          body: JSON.stringify(orderData),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Order created successfully! Order ID: ${data.id}`);

        // Reset form
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setCustomerAddress("");
        setCustomerCity("");
        setCustomerState("");
        setCustomerPincode("");
        setPaymentMethod("cod");
        setCartItems([]);

        // Callback
        if (onOrderCreated) {
          onOrderCreated(data);
        }

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.message || "Failed to create order");
      }
    } catch (err) {
      setError(err.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Info */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" color="textSecondary">
          Manually create orders for customers
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Customer Details Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
            👤 Customer Details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pincode"
                value={customerPincode}
                onChange={(e) => setCustomerPincode(e.target.value)}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                disabled={loading}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={customerState}
                onChange={(e) => setCustomerState(e.target.value)}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="cod">Cash on Delivery (COD)</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
                <MenuItem value="razorpay">Razorpay</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Products Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              📦 Products
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenProductDialog(true)}
              disabled={loading}
            >
              Add Product
            </Button>
          </Box>

          {cartItems.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.title}</TableCell>
                      <TableCell align="right">
                        ₹{parseFloat(item.price).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">{item.qty}</TableCell>
                      <TableCell align="right">
                        ₹{(parseFloat(item.price) * item.qty).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveProduct(item.id)}
                          disabled={loading}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No products added yet. Click "Add Product" to add items.
            </Alert>
          )}

          {/* Total */}
          {cartItems.length > 0 && (
            <Box
              sx={{ mt: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}
            >
              <Typography
                variant="h6"
                sx={{ textAlign: "right", fontWeight: "bold" }}
              >
                Total: ₹{calculateTotal()}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleCreateOrder}
          disabled={loading || cartItems.length === 0}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : "Create Order"}
        </Button>
      </Box>

      {/* Product Selection Dialog */}
      <Dialog
        open={openProductDialog}
        onClose={() => setOpenProductDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Product</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            select
            label="Select Product"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            sx={{ mb: 2 }}
          >
            {products.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.title} - ₹{parseFloat(product.price).toFixed(2)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            type="number"
            label="Quantity"
            value={selectedQuantity}
            onChange={(e) =>
              setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddProduct}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminCreateOrderForm;
