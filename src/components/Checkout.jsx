import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Fade from "@mui/material/Fade";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import StarIcon from "@mui/icons-material/Star";
import { useStore } from "../context/StoreContext.jsx";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";
import { formatINR } from "../utils/storage.js";
import paymentConfig from "../config/payment.js";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

const STEPS = ["Details", "Payment", "Confirmed"];
const EMPTY_ADDR_FORM = {
  label: "",
  name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  is_default: false,
};

async function addrApi(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${paymentConfig.backendBaseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function CheckoutPage({ categories, onSelectCategory }) {
  const navigate = useNavigate();
  const { isLoggedIn, customer: authCustomer } = useCustomerAuth();
  const { cartDetailed, cartSubtotal, placeOrder } = useStore();

  useEffect(() => {
    if (!isLoggedIn) navigate("/account", { replace: true });
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  if (cartDetailed.length === 0) {
    return (
      <Box
        sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Header
          categories={categories}
          onOpenCart={() => {}}
          onSelectCategory={onSelectCategory}
        />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 2,
            py: 8,
          }}
        >
          <Typography variant="h5">Your bag is empty</Typography>
          <Button variant="contained" onClick={() => navigate("/")}>
            Continue shopping
          </Button>
        </Box>
        <Footer onSelectCategory={onSelectCategory} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        categories={categories}
        onOpenCart={() => {}}
        onSelectCategory={onSelectCategory}
      />
      <Box
        component="main"
        sx={{ flex: 1, bgcolor: "background.default", py: { xs: 4, md: 6 } }}
      >
        <Container maxWidth="sm">
          <CheckoutForm
            authCustomer={authCustomer}
            cartDetailed={cartDetailed}
            cartSubtotal={cartSubtotal}
            placeOrder={placeOrder}
            onDone={() => navigate("/")}
          />
        </Container>
      </Box>
      <Footer onSelectCategory={onSelectCategory} />
    </Box>
  );
}

function CheckoutForm({
  authCustomer,
  cartDetailed,
  cartSubtotal,
  placeOrder,
  onDone,
}) {
  const { token } = useCustomerAuth();
  const [step, setStep] = useState(0);

  // The customer object that goes into the order
  const [customer, setCustomer] = useState({
    name: authCustomer?.name || "",
    phone: authCustomer?.phone || "",
    email: authCustomer?.email || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState({});
  const [method, setMethod] = useState("cod");
  const [order, setOrder] = useState(null);
  const [razorLoading, setRazorLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // ── Address book state ──────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState(null); // null = loading
  const [selectedId, setSelectedId] = useState(null);
  // 'pick' | 'add' | 'edit'
  const [addrMode, setAddrMode] = useState("pick");
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR_FORM);
  const [editingId, setEditingId] = useState(null);
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrError, setAddrError] = useState("");

  const loadAddresses = useCallback(async () => {
    if (!token || !paymentConfig.backendBaseUrl) {
      setAddresses([]);
      return;
    }
    try {
      const data = await addrApi("/api/auth/addresses", { token });
      setAddresses(data || []);
      if (data && data.length > 0) {
        const def = data.find((a) => a.is_default) || data[0];
        setSelectedId(def.id);
        fillFromAddr(def);
        setAddrMode("pick");
      } else {
        setAddrMode("add");
      }
    } catch {
      setAddresses([]);
      setAddrMode("add");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  function fillFromAddr(addr) {
    setCustomer((c) => ({
      ...c,
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state || "",
      pincode: addr.pincode,
    }));
  }

  function pickAddr(addr) {
    setSelectedId(addr.id);
    fillFromAddr(addr);
    setAddrMode("pick");
    setErrors({});
  }

  function startAdd() {
    setEditingId(null);
    setAddrForm({ ...EMPTY_ADDR_FORM, is_default: addresses?.length === 0 });
    setAddrError("");
    setAddrMode("add");
  }

  function startEdit(addr) {
    setEditingId(addr.id);
    setAddrForm({
      label: addr.label || "",
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state || "",
      pincode: addr.pincode,
      is_default: addr.is_default,
    });
    setAddrError("");
    setAddrMode("edit");
  }

  async function saveAddr() {
    const { name, phone, address, city, pincode } = addrForm;
    if (
      !name.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !pincode.trim()
    ) {
      setAddrError("Name, phone, address, city and pincode are required.");
      return;
    }
    setAddrSaving(true);
    setAddrError("");
    try {
      let saved;
      if (addrMode === "edit" && editingId) {
        saved = await addrApi(`/api/auth/addresses/${editingId}`, {
          token,
          method: "PUT",
          body: addrForm,
        });
      } else {
        saved = await addrApi("/api/auth/addresses", {
          token,
          method: "POST",
          body: addrForm,
        });
      }
      await loadAddresses();
      // Select the newly saved address
      if (saved) {
        setSelectedId(saved.id);
        fillFromAddr(saved);
      }
      setAddrMode("pick");
    } catch (err) {
      setAddrError(err.message);
    } finally {
      setAddrSaving(false);
    }
  }

  async function deleteAddr(id) {
    try {
      await addrApi(`/api/auth/addresses/${id}`, { token, method: "DELETE" });
      await loadAddresses();
    } catch {
      /* silently ignore */
    }
  }

  async function setDefault(id) {
    try {
      await addrApi(`/api/auth/addresses/${id}/default`, {
        token,
        method: "PUT",
      });
      await loadAddresses();
    } catch {
      /* silently ignore */
    }
  }

  // ── Validation & order flow ─────────────────────────────────────────────────
  function validateDetails() {
    const req = ["name", "phone", "address", "city", "pincode"];
    const next = {};
    req.forEach((k) => {
      if (!customer[k]?.trim()) next[k] = "Required";
    });
    if (customer.phone && !/^\d{10}$/.test(customer.phone.trim()))
      next.phone = "10-digit number";
    if (customer.pincode && !/^\d{6}$/.test(customer.pincode.trim()))
      next.pincode = "6-digit pincode";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goToPayment(e) {
    e.preventDefault();
    if (addrMode !== "pick") {
      setAddrError("Save or cancel the address form first.");
      return;
    }
    if (validateDetails()) setStep(1);
  }

  function finishOrder(paymentMethod, paymentRef) {
    const placed = placeOrder(customer, paymentMethod, paymentRef);
    setOrder(placed);
    setStep(2);
  }

  async function payWithRazorpay(restrictToUpi) {
    if (!paymentConfig.razorpayKeyId) return;
    if (!window.Razorpay) {
      alert("Razorpay script did not load.");
      return;
    }
    setPaymentError("");
    setRazorLoading(true);
    let orderId,
      amountForCheckout = Math.round(cartSubtotal * 100);
    if (paymentConfig.backendBaseUrl) {
      try {
        const res = await fetch(
          `${paymentConfig.backendBaseUrl}/api/create-order`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: cartDetailed.map((i) => ({
                productId: i.productId,
                qty: i.qty,
                unitPrice: i.unitPrice,
              })),
            }),
          },
        );
        if (!res.ok) throw new Error("create-order failed");
        const data = await res.json();
        orderId = data.orderId;
        amountForCheckout = data.amount;
      } catch (err) {
        setRazorLoading(false);
        setPaymentError("Couldn't reach payment server. Try again.");
        return;
      }
    }
    const options = {
      key: paymentConfig.razorpayKeyId,
      amount: amountForCheckout,
      currency: "INR",
      name: paymentConfig.payeeName,
      description: `${cartDetailed.length} item(s)`,
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone,
      },
      theme: { color: "#7c3f34" },
      handler: async (response) => {
        if (paymentConfig.backendBaseUrl) {
          try {
            const v = await fetch(
              `${paymentConfig.backendBaseUrl}/api/verify-payment`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              },
            );
            const { verified } = await v.json();
            setRazorLoading(false);
            if (!verified) {
              setPaymentError("Payment verification failed.");
              return;
            }
          } catch {
            setRazorLoading(false);
            setPaymentError(
              "Verification failed. Save payment ID: " +
                response.razorpay_payment_id,
            );
            return;
          }
        } else {
          setRazorLoading(false);
        }
        finishOrder(
          restrictToUpi ? "upi" : "razorpay",
          response.razorpay_payment_id,
        );
      },
      modal: { ondismiss: () => setRazorLoading(false) },
    };
    if (orderId) options.order_id = orderId;
    if (restrictToUpi)
      options.config = {
        display: {
          hide: [
            { method: "card" },
            { method: "netbanking" },
            { method: "wallet" },
            { method: "paylater" },
            { method: "emi" },
          ],
        },
      };
    new window.Razorpay(options).open();
  }

  const paymentOptions = [
    { key: "cod", label: "Cash on delivery", icon: LocalShippingOutlinedIcon },
    { key: "upi", label: "Scan & pay (UPI)", icon: QrCode2OutlinedIcon },
    {
      key: "razorpay",
      label: "Card / netbanking via Razorpay",
      icon: CreditCardOutlinedIcon,
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box>
      <Typography variant="h4" sx={{ fontSize: 26, mb: 3 }}>
        Checkout
      </Typography>
      <Stepper activeStep={step} sx={{ mb: 4 }} alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ── Step 0: Details ── */}
      {step === 0 && (
        <Box component="form" onSubmit={goToPayment}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Where should we send it?
          </Typography>

          {/* Loading */}
          {addresses === null && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {addresses !== null && (
            <>
              {/* ── Saved address list ── */}
              {addresses.length > 0 && addrMode === "pick" && (
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {addresses.map((addr) => (
                    <Paper
                      key={addr.id}
                      variant="outlined"
                      onClick={() => pickAddr(addr)}
                      sx={{
                        p: 1.5,
                        cursor: "pointer",
                        borderColor:
                          selectedId === addr.id ? "primary.main" : "divider",
                        borderWidth: selectedId === addr.id ? 2 : 1,
                        transition: "border-color 0.15s",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        spacing={1.25}
                      >
                        <Radio
                          checked={selectedId === addr.id}
                          size="small"
                          sx={{ mt: -0.25, flexShrink: 0 }}
                          readOnly
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.75}
                            flexWrap="wrap"
                            sx={{ mb: 0.25 }}
                          >
                            {addr.label && (
                              <Chip
                                label={addr.label}
                                size="small"
                                sx={{ fontSize: 11, fontWeight: 700 }}
                              />
                            )}
                            {addr.is_default && (
                              <Chip
                                icon={
                                  <StarIcon
                                    sx={{ fontSize: "12px !important" }}
                                  />
                                }
                                label="Default"
                                size="small"
                                color="primary"
                                sx={{ fontSize: 11, fontWeight: 700 }}
                              />
                            )}
                          </Stack>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                            {addr.name} · {addr.phone}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            {addr.address}, {addr.city}
                            {addr.state ? `, ${addr.state}` : ""} —{" "}
                            {addr.pincode}
                          </Typography>
                          {selectedId === addr.id && !addr.is_default && (
                            <Button
                              size="small"
                              sx={{
                                mt: 0.5,
                                p: 0,
                                fontWeight: 600,
                                fontSize: 12,
                                color: "text.secondary",
                                minWidth: 0,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDefault(addr.id);
                              }}
                            >
                              Set as default
                            </Button>
                          )}
                        </Box>
                        <Stack
                          direction="row"
                          sx={{ flexShrink: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconButton
                            size="small"
                            onClick={() => startEdit(addr)}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteAddr(addr.id)}
                          >
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}

                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={startAdd}
                    sx={{
                      alignSelf: "flex-start",
                      color: "text.secondary",
                      pl: 0,
                    }}
                  >
                    Add new address
                  </Button>
                </Stack>
              )}

              {/* ── Inline add / edit form ── */}
              <Collapse in={addrMode === "add" || addrMode === "edit"}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 2,
                    borderColor: "primary.main",
                    borderWidth: 1.5,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1.5, fontWeight: 700 }}
                  >
                    {addrMode === "edit" ? "Edit address" : "New address"}
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Label (e.g. Home / Office)"
                        value={addrForm.label}
                        onChange={(e) =>
                          setAddrForm((f) => ({ ...f, label: e.target.value }))
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Full name *"
                        value={addrForm.name}
                        onChange={(e) =>
                          setAddrForm((f) => ({ ...f, name: e.target.value }))
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Phone *"
                        value={addrForm.phone}
                        onChange={(e) =>
                          setAddrForm((f) => ({ ...f, phone: e.target.value }))
                        }
                      />
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Address *"
                        value={addrForm.address}
                        onChange={(e) =>
                          setAddrForm((f) => ({
                            ...f,
                            address: e.target.value,
                          }))
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="City *"
                        value={addrForm.city}
                        onChange={(e) =>
                          setAddrForm((f) => ({ ...f, city: e.target.value }))
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="State"
                        value={addrForm.state}
                        onChange={(e) =>
                          setAddrForm((f) => ({ ...f, state: e.target.value }))
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Pincode *"
                        value={addrForm.pincode}
                        onChange={(e) =>
                          setAddrForm((f) => ({
                            ...f,
                            pincode: e.target.value,
                          }))
                        }
                      />
                    </Grid>
                  </Grid>
                  {addrError && (
                    <Typography
                      color="error"
                      variant="caption"
                      sx={{ mt: 1, display: "block" }}
                    >
                      {addrError}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={saveAddr}
                      disabled={addrSaving}
                    >
                      {addrSaving
                        ? "Saving…"
                        : addrMode === "edit"
                          ? "Save changes"
                          : "Save address"}
                    </Button>
                    {addresses.length > 0 && (
                      <Button
                        size="small"
                        color="inherit"
                        onClick={() => {
                          setAddrMode("pick");
                          setAddrError("");
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Stack>
                </Paper>
              </Collapse>

              {/* ── Delivery details summary (shown when a saved address is selected) ── */}
              {addrMode === "pick" && (
                <>
                  {/* Email field (not part of address book) */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Email (optional)"
                    type="email"
                    value={customer.email}
                    onChange={(e) =>
                      setCustomer((c) => ({ ...c, email: e.target.value }))
                    }
                    sx={{ mb: 2 }}
                  />

                  {/* Show validation errors for missing address fields */}
                  {Object.keys(errors).length > 0 && (
                    <Typography
                      color="error"
                      variant="caption"
                      sx={{ mb: 1, display: "block" }}
                    >
                      Please select or add a valid delivery address.
                    </Typography>
                  )}
                </>
              )}

              {/* Email for no-saved-address state (form is inline) */}
              {addrMode === "add" && addresses.length === 0 && (
                <TextField
                  fullWidth
                  size="small"
                  label="Email (optional)"
                  type="email"
                  value={customer.email}
                  onChange={(e) =>
                    setCustomer((c) => ({ ...c, email: e.target.value }))
                  }
                  sx={{ mb: 2 }}
                />
              )}
            </>
          )}

          <OrderSummary items={cartDetailed} total={cartSubtotal} />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
          >
            Continue to payment
          </Button>
        </Box>
      )}

      {/* ── Step 1: Payment ── */}
      {step === 1 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            How would you like to pay?
          </Typography>
          <RadioGroup
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              {paymentOptions.map((opt) => (
                <Grid size={{ xs: 12, sm: 6 }} key={opt.key}>
                  <Paper
                    variant="outlined"
                    onClick={() => setMethod(opt.key)}
                    sx={{
                      p: 1.5,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      borderColor:
                        method === opt.key ? "primary.main" : "divider",
                      borderWidth: method === opt.key ? 2 : 1,
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    <FormControlLabel
                      value={opt.key}
                      control={<Radio size="small" />}
                      label={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <opt.icon
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {opt.label}
                          </Typography>
                        </Stack>
                      }
                      sx={{ m: 0, width: "100%" }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </RadioGroup>

          <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
            <Fade in={method === "cod"} unmountOnExit>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Pay in cash when your order arrives. We'll confirm by phone
                  before dispatch.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => finishOrder("cod")}
                >
                  Confirm order — {formatINR(cartSubtotal)}
                </Button>
              </Box>
            </Fade>
            <Fade in={method === "upi"} unmountOnExit>
              <Box>
                {paymentConfig.razorpayKeyId ? (
                  <Stack alignItems="center" spacing={1.5} textAlign="center">
                    <QrCode2OutlinedIcon
                      sx={{ fontSize: 44, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Opens a secure Razorpay window for UPI payment of{" "}
                      {formatINR(cartSubtotal)}.
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => payWithRazorpay(true)}
                      disabled={razorLoading}
                    >
                      {razorLoading
                        ? "Opening…"
                        : `Show payment QR — ${formatINR(cartSubtotal)}`}
                    </Button>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    UPI requires Razorpay to be connected. Add your Key ID to{" "}
                    <code>src/config/payment.js</code>.
                  </Typography>
                )}
              </Box>
            </Fade>
            <Fade in={method === "razorpay"} unmountOnExit>
              <Box>
                {paymentConfig.razorpayKeyId ? (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Card, netbanking, UPI or wallet via a secure Razorpay
                      window.
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => payWithRazorpay(false)}
                      disabled={razorLoading}
                    >
                      {razorLoading
                        ? "Opening…"
                        : `Pay ${formatINR(cartSubtotal)} with Razorpay`}
                    </Button>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Razorpay isn't connected. Add your Key ID to{" "}
                    <code>src/config/payment.js</code>.
                  </Typography>
                )}
              </Box>
            </Fade>
          </Paper>

          <Button color="inherit" onClick={() => setStep(0)}>
            ← Back to details
          </Button>
          {paymentError && (
            <Typography variant="body2" color="error.main" sx={{ mt: 1.5 }}>
              {paymentError}
            </Typography>
          )}
        </Box>
      )}

      {/* ── Step 2: Confirmed ── */}
      {step === 2 && order && (
        <Box textAlign="center" sx={{ py: 2 }}>
          <CheckCircleIcon
            sx={{ fontSize: 64, color: "success.main", mb: 2 }}
          />
          <Typography variant="h5" sx={{ mb: 1 }}>
            Order confirmed!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Order <strong>{order.id}</strong> — we've sent the details to your
            phone.
          </Typography>
          <OrderSummary
            items={order.items.map((i) => ({
              productId: i.productId,
              product: { title: i.title },
              qty: i.qty,
              lineTotal: i.unitPrice * i.qty,
            }))}
            total={order.total}
            totalLabel={
              order.paymentMethod === "cod"
                ? "Total (pay on delivery)"
                : "Total (paid)"
            }
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
            onClick={onDone}
          >
            Continue shopping
          </Button>
        </Box>
      )}
    </Box>
  );
}

function OrderSummary({ items, total, totalLabel = "Total" }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: "left" }}>
      {items.map((i) => (
        <Stack
          key={i.productId}
          direction="row"
          justifyContent="space-between"
          sx={{ py: 0.5 }}
        >
          <Typography variant="body2">
            {i.product.title} × {i.qty}
          </Typography>
          <Typography variant="body2">{formatINR(i.lineTotal)}</Typography>
        </Stack>
      ))}
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" justifyContent="space-between">
        <Typography sx={{ fontWeight: 700 }}>{totalLabel}</Typography>
        <Typography sx={{ fontWeight: 700 }}>{formatINR(total)}</Typography>
      </Stack>
    </Paper>
  );
}
