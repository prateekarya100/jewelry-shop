import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import StarIcon from "@mui/icons-material/Star";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { formatINR } from "../utils/storage.js";
import { getStatusMeta } from "../utils/orderStatus.js";
import paymentConfig from "../config/payment.js";
import Header from "./Header.jsx";
import PasswordField from "./PasswordField.jsx";
import Footer from "./Footer.jsx";
import Logo from "./Logo.jsx";
import OrderProgressTracker from "./OrderProgressTracker.jsx";

const FREE_SHIPPING_THRESHOLD = 999;

const EMPTY_LOGIN = { identifier: "", password: "" };
const EMPTY_REGISTER = { name: "", email: "", phone: "", password: "" };

export default function AccountPage({
  onExit,
  categories,
  onOpenCart,
  onSelectCategory,
  onCheckout,
}) {
  const { isLoggedIn } = useCustomerAuth();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        categories={categories}
        onOpenCart={onOpenCart}
        onSelectCategory={onSelectCategory}
      />
      <Box
        component="main"
        sx={{ flex: 1, bgcolor: "background.default", py: { xs: 5, md: 7 } }}
      >
        {isLoggedIn ? (
          <Container maxWidth="md">
            <AccountTabs onCheckout={onCheckout} />
          </Container>
        ) : (
          <Container maxWidth="sm">
            <AuthForm />
          </Container>
        )}
      </Box>
      <Footer onSelectCategory={onSelectCategory} />
    </Box>
  );
}

function AccountTabs({ onCheckout }) {
  const location = useLocation();
  const tabFromUrl = useMemo(() => {
    const t = parseInt(new URLSearchParams(location.search).get("tab"), 10);
    return isNaN(t) ? 0 : Math.min(Math.max(t, 0), 3);
  }, [location.search]);
  const [tab, setTab] = useState(tabFromUrl);

  // Sync when URL changes (e.g. menu click from /account to /account?tab=2)
  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);
  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="My Orders" />
        <Tab label="My Cart" />
        <Tab label="Addresses" />
        <Tab label="Security" />
      </Tabs>
      {tab === 0 && <OrderHistory />}
      {tab === 1 && <CartSection onCheckout={onCheckout} />}
      {tab === 2 && <AddressBook />}
      {tab === 3 && <SecuritySection />}
    </Box>
  );
}

// ─── Saved Address Book ───────────────────────────────────────────────────────

const LABEL_OPTIONS = ["Home", "Office", "Other"];
const EMPTY_ADDR = {
  label: "Home",
  name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  _customLabel: false,
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
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function AddressBook() {
  const { token } = useCustomerAuth();
  const [addresses, setAddresses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = add, object = edit
  const [form, setForm] = useState(EMPTY_ADDR);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await addrApi("/api/auth/addresses", { token });
      setAddresses(data);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_ADDR);
    setIsDefault(addresses?.length === 0);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(addr) {
    setEditing(addr);
    const lbl = addr.label || "Home";
    setForm({
      label: lbl,
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state || "",
      pincode: addr.pincode,
      _customLabel: !LABEL_OPTIONS.includes(lbl),
    });
    setIsDefault(addr.is_default);
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    const { name, phone, address, city, pincode } = form;
    if (
      !name.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !pincode.trim()
    ) {
      setFormError("Name, phone, address, city and pincode are required.");
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setFormError("Phone must be exactly 10 digits.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await addrApi(`/api/auth/addresses/${editing.id}`, {
          token,
          method: "PUT",
          body: { ...form, is_default: isDefault },
        });
      } else {
        await addrApi("/api/auth/addresses", {
          token,
          method: "POST",
          body: { ...form, is_default: isDefault },
        });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(id) {
    await addrApi(`/api/auth/addresses/${id}/default`, {
      token,
      method: "PUT",
    });
    await load();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await addrApi(`/api/auth/addresses/${deleteId}`, {
        token,
        method: "DELETE",
      });
      setDeleteId(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  if (!paymentConfig.backendBaseUrl) {
    return (
      <Typography color="text.secondary">
        Connect a backend to manage addresses.
      </Typography>
    );
  }

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Saved Addresses
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {addresses?.length ?? 0} address
            {addresses?.length !== 1 ? "es" : ""} saved
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
          size="small"
        >
          Add address
        </Button>
      </Stack>

      {loading && <CircularProgress size={24} />}

      {!loading && addresses?.length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <HomeOutlinedIcon sx={{ fontSize: 44, opacity: 0.3, mb: 1 }} />
          <Typography color="text.secondary">
            No saved addresses yet.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Add one now so checkout is faster next time.
          </Typography>
        </Paper>
      )}

      <Stack spacing={1.5}>
        {addresses?.map((addr) => (
          <Paper
            key={addr.id}
            variant="outlined"
            sx={{
              p: 2,
              borderColor: addr.is_default ? "primary.main" : "divider",
              borderWidth: addr.is_default ? 2 : 1,
              position: "relative",
            }}
          >
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={1}
            >
              <Box sx={{ flex: 1 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 0.5 }}
                >
                  {addr.label && (
                    <Chip
                      label={addr.label}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: 11 }}
                    />
                  )}
                  {addr.is_default && (
                    <Chip
                      icon={<StarIcon sx={{ fontSize: "14px !important" }} />}
                      label="Default"
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 700, fontSize: 11 }}
                    />
                  )}
                </Stack>
                <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                  {addr.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {addr.phone}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {addr.address}, {addr.city}
                  {addr.state ? `, ${addr.state}` : ""} — {addr.pincode}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.25}>
                <IconButton size="small" onClick={() => openEdit(addr)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setDeleteId(addr.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
            {!addr.is_default && (
              <Button
                size="small"
                sx={{ mt: 1, pl: 0, fontWeight: 600, color: "text.secondary" }}
                onClick={() => handleSetDefault(addr.id)}
              >
                Set as default
              </Button>
            )}
          </Paper>
        ))}
      </Stack>

      {/* ── Add/Edit dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing ? "Edit address" : "Add new address"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={1.5} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: form._customLabel ? 6 : 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Label</InputLabel>
                <Select
                  label="Label"
                  value={
                    LABEL_OPTIONS.includes(form.label) ? form.label : "Other"
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      label: e.target.value === "Other" ? "" : e.target.value,
                      _customLabel: e.target.value === "Other",
                    }))
                  }
                >
                  {LABEL_OPTIONS.map((l) => (
                    <MenuItem key={l} value={l}>
                      {l}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {form._customLabel && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Custom label"
                  value={form.label}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, label: e.target.value }))
                  }
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Full name *"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Phone * (10 digits)"
                value={form.phone}
                inputProps={{ inputMode: "numeric", maxLength: 10 }}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setForm((f) => ({ ...f, phone: val }));
                }}
                error={form.phone.length > 0 && form.phone.length < 10}
                helperText={
                  form.phone.length > 0 && form.phone.length < 10
                    ? "Must be 10 digits"
                    : ""
                }
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Address *"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                size="small"
                label="City *"
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="State"
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Pincode *"
                value={form.pincode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pincode: e.target.value }))
                }
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    Set as default address
                  </Typography>
                }
              />
            </Grid>
          </Grid>
          {formError && (
            <Typography
              color="error"
              variant="caption"
              sx={{ mt: 1, display: "block" }}
            >
              {formError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add address"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirm dialog ── */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete address?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This address will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function CartSection({ onCheckout }) {
  const {
    cartDetailed,
    updateCartQty,
    removeFromCart,
    cartSubtotal,
    cartCount,
  } = useStore();
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);
  const progress = Math.min(
    100,
    (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100,
  );

  if (cartDetailed.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
        <ShoppingBagOutlinedIcon sx={{ fontSize: 48, opacity: 0.35, mb: 2 }} />
        <Typography variant="h6">Your bag is empty</Typography>
        <Typography variant="body2">
          Browse the store and add something you love.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Free shipping progress */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{ mb: 1 }}
        >
          <LocalShippingOutlinedIcon
            sx={{
              fontSize: 16,
              color: remaining === 0 ? "success.main" : "text.secondary",
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: remaining === 0 ? "success.main" : "text.secondary",
            }}
          >
            {remaining === 0
              ? "You've unlocked free shipping!"
              : `Add ${formatINR(remaining)} more for free shipping`}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 5,
            borderRadius: 3,
            bgcolor: "rgba(0,0,0,0.08)",
            "& .MuiLinearProgress-bar": {
              bgcolor: remaining === 0 ? "success.main" : "secondary.main",
              borderRadius: 3,
            },
          }}
        />
      </Paper>

      {/* Items */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {cartDetailed.map((item) => (
          <Paper key={item.productId} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box
                component="img"
                src={item.product.images?.[0]}
                alt={item.product.title}
                sx={{
                  width: 80,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 1.5,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                  {item.product.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatINR(item.unitPrice)} each
                </Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}
                >
                  {/* Qty control */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() =>
                        updateCartQty(item.productId, item.qty - 1)
                      }
                    >
                      <RemoveIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                    <Typography
                      sx={{ minWidth: 28, textAlign: "center", fontSize: 14 }}
                    >
                      {item.qty}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() =>
                        updateCartQty(item.productId, item.qty + 1)
                      }
                    >
                      <AddIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                      {formatINR(item.lineTotal)}
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeFromCart(item.productId)}
                      sx={{ p: 0, minWidth: "auto", fontSize: 12 }}
                    >
                      Remove
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* Summary */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 0.5 }}
        >
          <Typography variant="body1">
            Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {formatINR(cartSubtotal)}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Shipping and taxes calculated at checkout.
        </Typography>
        <Button
          fullWidth
          variant="contained"
          size="large"
          sx={{ mt: 2 }}
          onClick={onCheckout}
        >
          Proceed to Checkout
        </Button>
      </Paper>
    </Box>
  );
}

function AuthForm() {
  const {
    login,
    submitMfaCode,
    mfaChallengePending,
    startRegister,
    verifyRegisterOtp,
    resendRegistrationOtp,
    cancelPendingRegistration,
    pendingRegistrationEmail,
    error,
    clearError,
  } = useCustomerAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER);
  const [mfaCode, setMfaCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function submitLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    await login(loginForm.identifier, loginForm.password);
    setSubmitting(false);
  }

  async function submitMfa(e) {
    e.preventDefault();
    setSubmitting(true);
    await submitMfaCode(mfaCode);
    setSubmitting(false);
  }

  async function submitStartRegister(e) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await startRegister(registerForm);
    setSubmitting(false);
    if (ok) setResendCooldown(30);
  }

  async function submitVerifyOtp(e) {
    e.preventDefault();
    setSubmitting(true);
    await verifyRegisterOtp(otpCode);
    setSubmitting(false);
  }

  async function handleResend() {
    setSubmitting(true);
    const ok = await resendRegistrationOtp();
    setSubmitting(false);
    if (ok) setResendCooldown(30);
  }

  if (mfaChallengePending) {
    return (
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Logo size={36} wordmarkSize={18} variant="dark" />
        </Box>
        <Typography variant="h6" sx={{ textAlign: "center", mb: 1 }}>
          Two-factor verification
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", mb: 3 }}
        >
          Enter the 6-digit code from your authenticator app.
        </Typography>
        <Box component="form" onSubmit={submitMfa}>
          <TextField
            autoFocus
            fullWidth
            label="6-digit code"
            value={mfaCode}
            onChange={(e) => {
              setMfaCode(e.target.value);
              if (error) clearError();
            }}
            error={!!error}
            helperText={error || " "}
            inputProps={{ inputMode: "numeric", maxLength: 6 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 1 }}
            disabled={submitting}
          >
            {submitting ? "Verifying…" : "Verify"}
          </Button>
        </Box>
      </Paper>
    );
  }

  // Registration has moved to step 2: a code was emailed, waiting for it.
  if (pendingRegistrationEmail) {
    return (
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Logo size={36} wordmarkSize={18} variant="dark" />
        </Box>
        <Typography variant="h6" sx={{ textAlign: "center", mb: 1 }}>
          Verify your email
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", mb: 3 }}
        >
          We sent a 6-digit code to <strong>{pendingRegistrationEmail}</strong>.
          It expires in 10 minutes.
        </Typography>
        <Box component="form" onSubmit={submitVerifyOtp}>
          <TextField
            autoFocus
            fullWidth
            label="6-digit code"
            value={otpCode}
            onChange={(e) => {
              setOtpCode(e.target.value);
              if (error) clearError();
            }}
            error={!!error}
            helperText={error || " "}
            inputProps={{ inputMode: "numeric", maxLength: 6 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 1 }}
            disabled={submitting || otpCode.length !== 6}
          >
            {submitting ? "Verifying…" : "Verify & create account"}
          </Button>
        </Box>
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
          <Button
            size="small"
            color="inherit"
            onClick={cancelPendingRegistration}
          >
            ← Back
          </Button>
          <Button
            size="small"
            onClick={handleResend}
            disabled={resendCooldown > 0 || submitting}
          >
            {resendCooldown > 0
              ? `Resend code (${resendCooldown}s)`
              : "Resend code"}
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4.5 } }}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <Logo size={36} wordmarkSize={18} variant="dark" />
      </Box>
      <Tabs
        value={tab}
        onChange={(_e, v) => {
          setTab(v);
          clearError();
        }}
        centered
        sx={{ mb: 3 }}
      >
        <Tab label="Sign in" />
        <Tab label="Create account" />
      </Tabs>

      {tab === 0 ? (
        <Box component="form" onSubmit={submitLogin}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, textAlign: "center" }}
          >
            Sign in to see your past orders and track current ones.
          </Typography>
          <Stack spacing={2}>
            <TextField
              autoFocus
              fullWidth
              label="Email or phone"
              value={loginForm.identifier}
              onChange={(e) =>
                setLoginForm((f) => ({ ...f, identifier: e.target.value }))
              }
            />
            <PasswordField
              fullWidth
              label="Password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm((f) => ({ ...f, password: e.target.value }))
              }
              error={!!error}
              helperText={error || " "}
            />
          </Stack>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 1 }}
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <Button
            fullWidth
            size="small"
            onClick={() => navigate("/forgot-password")}
            sx={{ mt: 1 }}
          >
            Forgot password?
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={submitStartRegister}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, textAlign: "center" }}
          >
            Create an account to track orders across any device.
          </Typography>
          <Stack spacing={2}>
            <TextField
              autoFocus
              fullWidth
              label="Full name"
              value={registerForm.name}
              onChange={(e) =>
                setRegisterForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              required
              value={registerForm.email}
              onChange={(e) =>
                setRegisterForm((f) => ({ ...f, email: e.target.value }))
              }
              helperText="Required — we'll send a verification code here"
            />
            <TextField
              fullWidth
              label="Phone"
              value={registerForm.phone}
              onChange={(e) =>
                setRegisterForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
            <PasswordField
              fullWidth
              label="Password"
              helperText="At least 6 characters"
              value={registerForm.password}
              onChange={(e) =>
                setRegisterForm((f) => ({ ...f, password: e.target.value }))
              }
            />
            {error && (
              <Typography variant="body2" color="error.main">
                {error}
              </Typography>
            )}
          </Stack>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 2 }}
            disabled={submitting}
          >
            {submitting ? "Sending code…" : "Register"}
          </Button>
        </Box>
      )}
    </Paper>
  );
}

function OrderHistory() {
  const { token, customer } = useCustomerAuth();
  const { products } = useStore();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `${paymentConfig.backendBaseUrl}/api/orders/mine`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res.ok) throw new Error("Could not load your orders");
        const data = await res.json();
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontSize: 26 }}>
            My orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {customer?.name} · {customer?.email || customer?.phone}
          </Typography>
        </Box>
      </Stack>

      <Typography variant="h6" sx={{ fontSize: 18, mb: 1.5 }}>
        Order history
      </Typography>

      {orders === null && !error && (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      )}
      {error && <Typography color="error.main">{error}</Typography>}
      {orders && orders.length === 0 && (
        <Typography color="text.secondary">
          No orders yet — once you place one, it'll show up here.
        </Typography>
      )}

      {orders && orders.length > 0 && (
        <Stack spacing={1.25}>
          {orders.map((o) => (
            <CustomerOrderAccordion key={o.id} order={o} products={products} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function SecuritySection() {
  const { customer, setup2fa, confirm2fa, disable2fa } = useCustomerAuth();
  const [setupOpen, setSetupOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function startSetup() {
    setError("");
    setBusy(true);
    try {
      const { qrCodeDataUrl } = await setup2fa();
      setQrCode(qrCodeDataUrl);
      setSetupOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await confirm2fa(code);
      setSetupOpen(false);
      setCode("");
      window.location.reload(); // simplest way to refresh customer.mfaEnabled from a fresh /me-equivalent state
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    try {
      await disable2fa();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        justifyContent="space-between"
        rowGap={1.5}
        sx={{ flexWrap: "wrap" }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ShieldOutlinedIcon sx={{ color: "secondary.dark" }} />
          <Box>
            <Typography sx={{ fontWeight: 700 }}>
              Two-factor authentication
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {customer?.mfaEnabled
                ? "Enabled — extra code required at sign in."
                : "Add an extra layer of security to your account."}
            </Typography>
          </Box>
        </Stack>
        {customer?.mfaEnabled ? (
          <Button
            size="small"
            color="error"
            onClick={handleDisable}
            disabled={busy}
          >
            Disable
          </Button>
        ) : (
          <Button
            size="small"
            variant="outlined"
            onClick={startSetup}
            disabled={busy}
          >
            Enable
          </Button>
        )}
      </Stack>

      <Dialog
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Set up two-factor authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Scan this QR code with Google Authenticator, Authy, or any TOTP app,
            then enter the 6-digit code it shows.
          </Typography>
          {qrCode && (
            <Box
              component="img"
              src={qrCode}
              alt="2FA QR code"
              sx={{
                display: "block",
                mx: "auto",
                mb: 2,
                width: 200,
                height: 200,
              }}
            />
          )}
          <Box component="form" onSubmit={confirmSetup}>
            <TextField
              fullWidth
              autoFocus
              label="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={!!error}
              helperText={error || " "}
              inputProps={{ inputMode: "numeric", maxLength: 6 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 1 }}
              disabled={busy}
            >
              {busy ? "Confirming…" : "Confirm & enable"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Paper>
  );
}

function CustomerOrderAccordion({ order: o, products }) {
  const status = o.fulfillmentStatus || "confirmed";
  const meta = getStatusMeta(status);
  const isPaid = o.paymentMethod !== "cod";
  const isCancelled = status === "cancelled";
  const productImage = (productId) =>
    products?.find((p) => p.id === productId)?.images?.[0];

  return (
    <Accordion
      variant="outlined"
      disableGutters
      sx={{
        "&:before": { display: "none" },
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 0.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ width: "100%", pr: 1 }}
        >
          <Stack direction="row" sx={{ flexShrink: 0 }}>
            {o.items.slice(0, 3).map((item, idx) => (
              <Box
                key={item.productId}
                component="img"
                src={productImage(item.productId) || undefined}
                alt=""
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  objectFit: "cover",
                  border: "2px solid #fff",
                  bgcolor: "grey.100",
                  ml: idx === 0 ? 0 : -1.5,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                  position: "relative",
                  zIndex: 3 - idx,
                }}
              />
            ))}
          </Stack>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }} noWrap>
              {o.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(o.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Typography>
          </Box>
          <Stack alignItems="flex-end" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Chip
              size="small"
              label={meta.label}
              sx={{
                bgcolor: meta.bg,
                color: meta.color,
                fontWeight: 700,
                fontSize: 11.5,
              }}
            />
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>
              {formatINR(o.total)}
            </Typography>
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, bgcolor: "rgba(184,112,63,0.03)" }}>
        <Divider sx={{ mb: 2.5 }} />

        {!isCancelled && (
          <Box sx={{ mb: 3 }}>
            <OrderProgressTracker status={status} />
          </Box>
        )}

        <Stack spacing={1.25} sx={{ mb: 1.5 }}>
          {o.items.map((i) => (
            <Stack
              key={i.productId}
              direction="row"
              alignItems="center"
              spacing={1.5}
            >
              <Box
                component="img"
                src={productImage(i.productId) || undefined}
                alt=""
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  objectFit: "cover",
                  bgcolor: "grey.100",
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {i.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Qty {i.qty}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, flexShrink: 0 }}
              >
                {formatINR(i.unitPrice * i.qty)}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="body2" color="text.secondary">
            {isPaid
              ? o.paymentRef
                ? `Ref: ${o.paymentRef}`
                : "Paid"
              : "Cash on delivery"}
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
            {formatINR(o.total)}
          </Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
