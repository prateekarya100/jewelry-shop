import React, { useState } from "react";
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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import { useStore } from "../context/StoreContext.jsx";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";
import { formatINR } from "../utils/storage.js";
import paymentConfig from "../config/payment.js";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

const EMPTY_CUSTOMER = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};
const STEPS = ["Details", "Payment", "Confirmed"];

export default function CheckoutPage({ categories, onSelectCategory }) {
  const navigate = useNavigate();
  const { isLoggedIn, customer: authCustomer } = useCustomerAuth();
  const { cartDetailed, cartSubtotal, placeOrder } = useStore();

  // Redirect if not logged in
  // Redirect if not logged in
  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate("/account", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  // Redirect if cart is empty
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
  const [step, setStep] = useState(0);
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

  function validateDetails() {
    const req = ["name", "phone", "address", "city", "pincode"];
    const next = {};
    req.forEach((k) => {
      if (!customer[k].trim()) next[k] = "Required";
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
      alert(
        "Razorpay script did not load. Check your connection and try again.",
      );
      return;
    }
    setPaymentError("");
    setRazorLoading(true);

    let orderId;
    let amountForCheckout = Math.round(cartSubtotal * 100);

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
        if (!res.ok) throw new Error("create-order request failed");
        const data = await res.json();
        orderId = data.orderId;
        amountForCheckout = data.amount;
      } catch (err) {
        console.error(err);
        setRazorLoading(false);
        setPaymentError("Couldn't reach the payment server. Please try again.");
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
      handler: async function (response) {
        if (paymentConfig.backendBaseUrl) {
          try {
            const verifyRes = await fetch(
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
            const { verified } = await verifyRes.json();
            setRazorLoading(false);
            if (!verified) {
              setPaymentError(
                "Payment could not be verified. Contact support before paying again.",
              );
              return;
            }
          } catch (err) {
            setRazorLoading(false);
            setPaymentError(
              "Verification failed. Contact support with payment ID: " +
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
    if (restrictToUpi) {
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
    }
    const rzp = new window.Razorpay(options);
    rzp.open();
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

      {step === 0 && (
        <Box component="form" onSubmit={goToPayment}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Where should we send it?
          </Typography>
          <Grid container spacing={1.75} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Full name"
                value={customer.name}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, name: e.target.value }))
                }
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Phone"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, phone: e.target.value }))
                }
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Email (optional)"
                type="email"
                value={customer.email}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, email: e.target.value }))
                }
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Address"
                value={customer.address}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, address: e.target.value }))
                }
                error={!!errors.address}
                helperText={errors.address}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="City"
                value={customer.city}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, city: e.target.value }))
                }
                error={!!errors.city}
                helperText={errors.city}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="State"
                value={customer.state}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, state: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Pincode"
                value={customer.pincode}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, pincode: e.target.value }))
                }
                error={!!errors.pincode}
                helperText={errors.pincode}
              />
            </Grid>
          </Grid>

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
