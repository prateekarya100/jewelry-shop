import React, { useState, useMemo, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Tooltip from "@mui/material/Tooltip";
import Switch from "@mui/material/Switch";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import CircularProgress from "@mui/material/CircularProgress";
import InputLabel from "@mui/material/InputLabel";
import DialogActions from "@mui/material/DialogActions";
import useMediaQuery from "@mui/material/useMediaQuery";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlineOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import BlockIcon from "@mui/icons-material/Block";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import SearchIcon from "@mui/icons-material/Search";
import OrderProgressTracker from "./OrderProgressTracker.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { formatINR } from "../utils/storage.js";
import {
  STATUS_META,
  STATUS_ORDER,
  getStatusMeta,
} from "../utils/orderStatus.js";
import {
  buildShippingText,
  printOrder,
  downloadOrder,
} from "../utils/orderExport.js";
import paymentConfig from "../config/payment.js";
import Logo from "./Logo.jsx";
import PasswordField from "./PasswordField.jsx";

const EMPTY_FORM = {
  title: "",
  category: "",
  tagline: "",
  description: "",
  price: "",
  discount: "",
  images: "",
  video: "",
  material: "",
  stock: "",
};

const ALL_NAV = [
  { key: "overview", label: "Overview", icon: DashboardOutlinedIcon },
  { key: "products", label: "Products", icon: Inventory2OutlinedIcon },
  { key: "orders", label: "Orders", icon: ReceiptLongOutlinedIcon },
  { key: "customers", label: "Customers", icon: PeopleOutlineIcon },
  { key: "team", label: "Team", icon: GroupsOutlinedIcon },
];

const PERM_LABELS = {
  view_orders: "View orders",
  edit_orders: "Edit orders (change status)",
  view_products: "View products",
  edit_products: "Edit products (add/edit/delete)",
  view_customers: "View customers",
  manage_customers: "Manage customers (suspend/delete)",
  manage_team: "Manage team (roles & users)",
};

const CUSTOMER_STATUS_META = {
  active: {
    label: "Active",
    bg: "rgba(74,122,82,0.12)",
    color: "success.main",
  },
  suspended: {
    label: "Suspended",
    bg: "rgba(184,112,63,0.16)",
    color: "secondary.dark",
  },
  deactivated: {
    label: "Deactivated",
    bg: "rgba(122,32,54,0.1)",
    color: "error.main",
  },
};

const DATE_FILTERS = [
  { value: "all", label: "All time" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

async function api(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${paymentConfig.backendBaseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export default function AdminDashboard({ onExit }) {
  const { products, orders: localOrders, refreshProducts, notify } = useStore();
  const {
    isAdmin,
    login,
    submitMfaCode,
    mfaChallengePending,
    error,
    clearError,
    token,
    logout,
    isSuperAdmin,
    permissions: perms,
  } = useAdminAuth();

  const NAV = useMemo(
    () =>
      ALL_NAV.filter((item) => {
        if (item.key === "overview") return true;
        if (item.key === "products") return isSuperAdmin || perms.view_products;
        if (item.key === "orders") return isSuperAdmin || perms.view_orders;
        if (item.key === "customers")
          return isSuperAdmin || perms.view_customers;
        if (item.key === "team") return isSuperAdmin;
        return true;
      }),
    [isSuperAdmin, perms],
  );
  // Below this width, use the compact phone shell (bottom nav, card lists
  // instead of tables). Deliberately narrower than a typical "mobile"
  // breakpoint (820px) — portrait tablets (iPad Mini at 744px, iPad at
  // 768px) have plenty of room for the real sidebar + table layout, and
  // shouldn't be squeezed into the phone treatment.
  const isMobile = useMediaQuery("(max-width:680px)");
  const [nav, setNav] = useState("overview");
  const [productPage, setProductPage] = useState("list"); // 'list' | 'form'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [backendOrders, setBackendOrders] = useState(null); // null until first backend fetch resolves

  // Order filters
  const [dateFilter, setDateFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    if (isAdmin) refreshProducts();
  }, [isAdmin, refreshProducts]);

  // Orders come from the shared backend when one is configured — that's
  // what makes status changes here visible in the customer's own "My
  // Orders" view on their own device. Falls back to this browser's local
  // order history if no backend is configured (offline/demo mode).
  const loadOrders = useCallback(async () => {
    if (!paymentConfig.backendBaseUrl || !isAdmin) return;
    try {
      const data = await api("/api/admin/orders", { token });
      setBackendOrders(data);
    } catch (err) {
      if (err.status === 401) {
        handleSessionExpired();
        return;
      }
      console.warn("Could not load orders from backend:", err);
      setBackendOrders([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const orders = paymentConfig.backendBaseUrl
    ? backendOrders || []
    : localOrders;

  // --- Customers (admin moderation: suspend, deactivate, reactivate, delete) ---
  const [customers, setCustomers] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const filteredCustomers = useMemo(() => {
    if (!customers) return customers;
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.name || "").toLowerCase().includes(q),
    );
  }, [customers, customerSearch]);
  const [deleteTarget, setDeleteTarget] = useState(null); // customer pending permanent deletion

  const loadCustomers = useCallback(async () => {
    if (!paymentConfig.backendBaseUrl || !isAdmin) return;
    try {
      const data = await api("/api/admin/customers", { token });
      setCustomers(data);
    } catch (err) {
      if (err.status === 401) {
        handleSessionExpired();
        return;
      }
      console.warn("Could not load customers from backend:", err);
      setCustomers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  async function handleCustomerStatusChange(customerId, status) {
    try {
      await api(`/api/admin/customers/${customerId}/status`, {
        token,
        method: "PUT",
        body: { status },
      });
      await loadCustomers();
      notify(`Account ${status}`);
    } catch (err) {
      if (err.status === 401) {
        handleSessionExpired();
        return;
      }
      notify(err.message);
    }
  }

  async function handleDeleteCustomer(customerId) {
    try {
      await api(`/api/admin/customers/${customerId}`, {
        token,
        method: "DELETE",
      });
      await loadCustomers();
      setDeleteTarget(null);
      notify("Account permanently deleted");
    } catch (err) {
      if (err.status === 401) {
        handleSessionExpired();
        return;
      }
      notify(err.message);
    }
  }

  async function handleStatusChange(orderId, status) {
    if (!paymentConfig.backendBaseUrl) {
      notify(
        "Connect a backend (src/config/payment.js) to change order status.",
      );
      return;
    }
    try {
      await api(`/api/admin/orders/${orderId}/status`, {
        token,
        method: "PUT",
        body: { status },
      });
      await loadOrders();
      notify("Order status updated");
    } catch (err) {
      if (err.status === 401) {
        handleSessionExpired();
        return;
      }
      notify(err.message);
    }
  }

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    const lowStock = products.filter((p) => (p.stock ?? 0) <= 5).length;

    // Real week-over-week comparison — this week's orders/revenue vs the
    // previous 7-day window, from actual order dates (no fabricated numbers).
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
    const thisWeekOrders = orders.filter((o) => new Date(o.date) >= weekAgo);
    const lastWeekOrders = orders.filter((o) => {
      const d = new Date(o.date);
      return d >= twoWeeksAgo && d < weekAgo;
    });
    const thisWeekRevenue = thisWeekOrders.reduce((s, o) => s + o.total, 0);
    const lastWeekRevenue = lastWeekOrders.reduce((s, o) => s + o.total, 0);

    function trend(current, previous) {
      if (previous === 0) return current > 0 ? { pct: 100, up: true } : null;
      const pct = Math.round(((current - previous) / previous) * 100);
      return { pct: Math.abs(pct), up: pct >= 0 };
    }

    return {
      productCount: products.length,
      orderCount: orders.length,
      revenue,
      lowStock,
      orderTrend: trend(thisWeekOrders.length, lastWeekOrders.length),
      revenueTrend: trend(thisWeekRevenue, lastWeekRevenue),
    };
  }, [products, orders]);

  const filteredOrders = useMemo(() => {
    if (dateFilter === "all") return orders;
    const now = new Date();
    return orders.filter((o) => {
      const d = new Date(o.date);
      if (dateFilter === "week") {
        const from = new Date(now);
        from.setDate(now.getDate() - 7);
        return d >= from;
      }
      if (dateFilter === "month") {
        const from = new Date(now);
        from.setMonth(now.getMonth() - 1);
        return d >= from;
      }
      if (dateFilter === "year") {
        const from = new Date(now);
        from.setFullYear(now.getFullYear() - 1);
        return d >= from;
      }
      if (dateFilter === "custom") {
        if (customFrom && d < new Date(customFrom)) return false;
        if (customTo && d > new Date(`${customTo}T23:59:59`)) return false;
        return true;
      }
      return true;
    });
  }, [orders, dateFilter, customFrom, customTo]);

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setProductPage("form");
  }

  function openEditForm(p) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      category: p.category,
      tagline: p.tagline || "",
      description: p.description || "",
      price: p.price,
      discount: p.discount || 0,
      images: (p.images || []).join(", "),
      video: p.video || "",
      material: p.material || "",
      stock: p.stock ?? "",
    });
    setFormError("");
    setProductPage("form");
  }

  // If the backend rejects a request as unauthenticated (session expired,
  // most commonly because the backend restarted since you logged in —
  // sessions live in its memory, not on disk), sign out and bounce back to
  // the login screen with a clear reason, instead of failing silently
  // in a way that's easy to miss and looks like "my edit didn't save."
  function handleSessionExpired() {
    logout();
    onExit();
    notify("Your session expired — please sign in again.");
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.category.trim() || !form.price) {
      setFormError("Title, category and price are required.");
      return;
    }
    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      discount: Number(form.discount) || 0,
      images: form.images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      video: form.video.trim(),
      material: form.material.trim(),
      stock: Number(form.stock) || 0,
    };
    if (payload.images.length === 0) {
      payload.images = [
        "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=900&auto=format&fit=crop",
      ];
    }
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await api(`/api/admin/products/${editingId}`, {
          token,
          method: "PUT",
          body: payload,
        });
        notify("Product updated");
      } else {
        await api("/api/admin/products", {
          token,
          method: "POST",
          body: payload,
        });
        notify("Product added — now live on the storefront");
      }
      await refreshProducts();
      setProductPage("list");
    } catch (err) {
      if (err.status === 401) {
        handleSessionExpired();
        return;
      }
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api(`/api/admin/products/${id}`, { token, method: "DELETE" });
      await refreshProducts();
      notify("Product removed");
    } catch (err) {
      if (err.status === 401) {
        handleSessionExpired();
        return;
      }
      notify(err.message);
    }
  }

  if (!isAdmin) {
    return (
      <AdminLoginPage
        onExit={onExit}
        login={login}
        submitMfaCode={submitMfaCode}
        mfaChallengePending={mfaChallengePending}
        error={error}
        clearError={clearError}
      />
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        pb: isMobile ? 7 : 0,
      }}
    >
      {/* Mobile top bar (replaces sidebar below 820px) */}
      {isMobile && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            borderBottom: "1px solid rgba(250,241,236,0.12)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            component="button"
            onClick={() => setNav("overview")}
            sx={{ background: "none", border: 0, p: 0, cursor: "pointer" }}
          >
            <Logo size={26} wordmarkSize={15} />
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View store">
              <IconButton
                size="small"
                onClick={onExit}
                sx={{ color: "primary.contrastText" }}
              >
                <StorefrontOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Log out">
              <IconButton
                size="small"
                onClick={() => {
                  logout();
                  onExit();
                }}
                sx={{ color: "primary.contrastText" }}
              >
                <LogoutOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{
            width: 240,
            flexShrink: 0,
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            flexDirection: "column",
            py: 2.5,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.2}
            component="button"
            onClick={() => setNav("overview")}
            sx={{
              px: 2.5,
              mb: 3,
              background: "none",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Logo size={30} wordmarkSize={17} />
          </Stack>

          <List sx={{ flex: 1, px: 1.5 }}>
            {NAV.map((item) => (
              <ListItemButton
                key={item.key}
                selected={nav === item.key}
                onClick={() => setNav(item.key)}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.5,
                  color: "rgba(250,241,236,0.85)",
                  "&.Mui-selected": {
                    bgcolor: "rgba(250,241,236,0.12)",
                    color: "#fff",
                  },
                  "&:hover": { bgcolor: "rgba(250,241,236,0.08)" },
                }}
              >
                <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                  <item.icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>

          <Stack spacing={0.5} sx={{ px: 1.5 }}>
            <ListItemButton
              onClick={onExit}
              sx={{ borderRadius: 1.5, color: "rgba(250,241,236,0.85)" }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                <StorefrontOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="View store" />
            </ListItemButton>
            <ListItemButton
              onClick={() => {
                logout();
                onExit();
              }}
              sx={{ borderRadius: 1.5, color: "rgba(250,241,236,0.85)" }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                <LogoutOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Log out" />
            </ListItemButton>
          </Stack>
        </Box>
      )}

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          p: { xs: 2, sm: 2.5, md: 4 },
          pt: isMobile ? 9 : { md: 4 },
          maxWidth: 1200,
          overflowX: "hidden",
          minWidth: 0,
        }}
      >
        {nav === "overview" && (
          <Box>
            <Typography
              variant="h4"
              sx={{ fontSize: { xs: 22, md: 26 }, mb: 3 }}
            >
              Overview
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <StatCard
                label="Products"
                value={stats.productCount}
                icon={Inventory2Icon}
                onClick={() => setNav("products")}
              />
              <StatCard
                label="Orders"
                value={stats.orderCount}
                icon={ReceiptLongIcon}
                trend={stats.orderTrend}
                onClick={() => setNav("orders")}
              />
              <StatCard
                label="Revenue"
                value={formatINR(stats.revenue)}
                icon={PaymentsIcon}
                trend={stats.revenueTrend}
              />
              <StatCard
                label="Low stock (≤5)"
                value={stats.lowStock}
                icon={WarningAmberIcon}
                accent={stats.lowStock > 0}
                onClick={() => setNav("products")}
              />
            </Grid>
            <Typography variant="h6" sx={{ fontSize: 18, mb: 1.5 }}>
              Recent orders
            </Typography>
            {orders.length === 0 ? (
              <Typography color="text.secondary">No orders yet.</Typography>
            ) : (
              <Paper variant="outlined" sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.slice(0, 5).map((o) => {
                      const meta = getStatusMeta(o.fulfillmentStatus);
                      return (
                        <TableRow
                          key={o.id}
                          hover
                          onClick={() => setNav("orders")}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell>{o.id}</TableCell>
                          <TableCell>{o.customer.name}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={meta.label}
                              sx={{
                                bgcolor: meta.bg,
                                color: meta.color,
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatINR(o.total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        )}

        {nav === "products" && productPage === "list" && (
          <Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              spacing={1.5}
              sx={{ mb: 3 }}
            >
              <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 26 } }}>
                Products
              </Typography>
              {(isSuperAdmin || perms.edit_products) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openAddForm}
                >
                  Add product
                </Button>
              )}
            </Stack>

            {isMobile ? (
              <Stack spacing={1.25}>
                {products.map((p) => (
                  <Paper
                    key={p.id}
                    variant="outlined"
                    sx={{ p: 1.5, display: "flex", gap: 1.5 }}
                  >
                    <Box
                      component="img"
                      src={p.images?.[0]}
                      alt=""
                      sx={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 1.5,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{ fontWeight: 700, fontSize: 14.5 }}
                        noWrap
                      >
                        {p.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {p.category} · Stock: {p.stock ?? "—"}
                      </Typography>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mt: 0.75 }}
                      >
                        <Stack
                          direction="row"
                          alignItems="baseline"
                          spacing={0.75}
                        >
                          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                            {formatINR(p.price)}
                          </Typography>
                          {p.discount > 0 && (
                            <Typography
                              variant="caption"
                              sx={{ color: "success.main", fontWeight: 700 }}
                            >
                              -{p.discount}%
                            </Typography>
                          )}
                        </Stack>
                        {(isSuperAdmin || perms.edit_products) && (
                          <Stack direction="row">
                            <IconButton
                              size="small"
                              onClick={() => openEditForm(p)}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(p.id)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        )}
                      </Stack>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Paper variant="outlined" sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell />
                      <TableCell>Title</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Discount</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ py: 0.75 }}>
                          <Box
                            component="img"
                            src={p.images?.[0]}
                            alt=""
                            sx={{
                              width: 44,
                              height: 44,
                              objectFit: "cover",
                              borderRadius: 1.5,
                              display: "block",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {p.title}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={p.category}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: "divider",
                              fontWeight: 600,
                              fontSize: 11.5,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatINR(p.price)}
                        </TableCell>
                        <TableCell align="right">
                          {p.discount ? (
                            <Chip
                              label={`-${p.discount}%`}
                              size="small"
                              sx={{
                                bgcolor: "rgba(74,122,82,0.12)",
                                color: "success.main",
                                fontWeight: 700,
                                fontSize: 11.5,
                              }}
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color:
                                (p.stock ?? 0) === 0
                                  ? "error.main"
                                  : (p.stock ?? 0) <= 5
                                    ? "secondary.dark"
                                    : "text.primary",
                            }}
                          >
                            {p.stock ?? "—"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {(isSuperAdmin || perms.edit_products) && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => openEditForm(p)}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(p.id)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        )}

        {nav === "products" && productPage === "form" && (
          <Box sx={{ maxWidth: 720 }}>
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => setProductPage("list")}
              sx={{ mb: 2, color: "text.secondary", pl: 0 }}
            >
              Back to products
            </Button>
            <Typography
              variant="h4"
              sx={{ fontSize: { xs: 22, md: 26 }, mb: 3 }}
            >
              {editingId ? "Edit product" : "Add a new product"}
            </Typography>
            <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Box component="form" onSubmit={submitForm}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Title"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Section / category"
                      placeholder="e.g. Rings"
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Tagline"
                      value={form.tagline}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, tagline: e.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Description"
                      multiline
                      minRows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Price (₹)"
                      value={form.price}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, price: e.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Discount (%)"
                      value={form.discount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, discount: e.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Material"
                      value={form.material}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, material: e.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Image URLs (comma separated)"
                      placeholder="https://…, https://…"
                      value={form.images}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, images: e.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Demo video URL (.mp4 or YouTube)"
                      value={form.video}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, video: e.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Stock"
                      value={form.stock}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, stock: e.target.value }))
                      }
                    />
                  </Grid>
                </Grid>
                {formError && (
                  <Typography color="error.main" variant="body2" sx={{ mt: 2 }}>
                    {formError}
                  </Typography>
                )}
                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  spacing={1.5}
                  sx={{ mt: 3 }}
                >
                  <Button
                    color="inherit"
                    onClick={() => setProductPage("list")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving
                      ? "Saving…"
                      : editingId
                        ? "Save changes"
                        : "Add product"}
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Box>
        )}

        {nav === "orders" && (
          <Box>
            <Typography
              variant="h4"
              sx={{ fontSize: { xs: 22, md: 26 }, mb: 2.5 }}
            >
              Orders
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              rowGap={1}
              sx={{ mb: dateFilter === "custom" ? 1.5 : 3, flexWrap: "wrap" }}
            >
              {DATE_FILTERS.map((f) => (
                <Chip
                  key={f.value}
                  label={f.label}
                  onClick={() => setDateFilter(f.value)}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor:
                      dateFilter === f.value
                        ? "primary.main"
                        : "background.paper",
                    color:
                      dateFilter === f.value
                        ? "primary.contrastText"
                        : "text.primary",
                    border: "1px solid",
                    borderColor:
                      dateFilter === f.value ? "primary.main" : "divider",
                  }}
                />
              ))}
            </Stack>

            {dateFilter === "custom" && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ mb: 3 }}
              >
                <TextField
                  size="small"
                  type="date"
                  label="From"
                  InputLabelProps={{ shrink: true }}
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
                <TextField
                  size="small"
                  type="date"
                  label="To"
                  InputLabelProps={{ shrink: true }}
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </Stack>
            )}

            {filteredOrders.length === 0 ? (
              <Typography color="text.secondary">
                No orders in this range.
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {filteredOrders.map((o) => (
                  <OrderAccordion
                    key={o.id}
                    order={o}
                    products={products}
                    onCopy={() => notify("Shipping details copied")}
                    onStatusChange={(status) =>
                      handleStatusChange(o.id, status)
                    }
                    canEditOrders={isSuperAdmin || !!perms.edit_orders}
                  />
                ))}
              </Stack>
            )}
          </Box>
        )}

        {nav === "team" && isSuperAdmin && (
          <TeamSection token={token} onSessionExpired={handleSessionExpired} />
        )}

        {nav === "customers" && (
          <Box>
            <Typography
              variant="h4"
              sx={{ fontSize: { xs: 22, md: 26 }, mb: 0.5 }}
            >
              Customers
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Suspend or deactivate an account to block sign-in without losing
              their order history, or delete permanently to remove the account
              entirely.
            </Typography>

            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email, or phone…"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon
                    fontSize="small"
                    sx={{ color: "text.secondary", mr: 1 }}
                  />
                ),
              }}
              sx={{ mb: 2.5, maxWidth: 420 }}
            />

            {customers === null ? (
              <Stack alignItems="center" sx={{ py: 6 }}>
                <CircularProgress size={28} />
              </Stack>
            ) : customers.length === 0 ? (
              <Typography color="text.secondary">
                No customer accounts yet.
              </Typography>
            ) : filteredCustomers.length === 0 ? (
              <Typography color="text.secondary">
                No customers match "{customerSearch}".
              </Typography>
            ) : isMobile ? (
              <Stack spacing={1.5}>
                {filteredCustomers.map((c) => (
                  <CustomerCard
                    key={c.id}
                    customer={c}
                    onStatusChange={handleCustomerStatusChange}
                    onDelete={() => setDeleteTarget(c)}
                    canManage={isSuperAdmin || !!perms.manage_customers}
                  />
                ))}
              </Stack>
            ) : (
              <Paper variant="outlined" sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Joined</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCustomers.map((c) => {
                      const meta =
                        CUSTOMER_STATUS_META[c.status] ||
                        CUSTOMER_STATUS_META.active;
                      return (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {c.name}
                          </TableCell>
                          <TableCell>{c.email || c.phone}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={meta.label}
                              sx={{
                                bgcolor: meta.bg,
                                color: meta.color,
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            <CustomerActions
                              customer={c}
                              onStatusChange={handleCustomerStatusChange}
                              onDelete={() => setDeleteTarget(c)}
                              canManage={
                                isSuperAdmin || !!perms.manage_customers
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        )}
      </Box>

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete this account permanently?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{deleteTarget?.name}</strong> (
            {deleteTarget?.email || deleteTarget?.phone}) will be permanently
            removed and won't be able to sign in again. This can't be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Their past orders are kept for your records but will no longer be
            linked to an account.
          </Typography>
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={1.5}
            sx={{ mt: 3 }}
          >
            <Button color="inherit" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => handleDeleteCustomer(deleteTarget.id)}
            >
              Delete permanently
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Mobile bottom navigation */}
      {isMobile && (
        <BottomNavigation
          value={nav}
          onChange={(_e, value) => setNav(value)}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            borderTop: "1px solid",
            borderColor: "divider",
            height: 60,
          }}
        >
          {NAV.map((item) => (
            <BottomNavigationAction
              key={item.key}
              label={item.label}
              value={item.key}
              icon={<item.icon fontSize="small" />}
              sx={{
                "&.Mui-selected": { color: "secondary.dark" },
                minWidth: "auto",
              }}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
}

function StatCard({ label, value, accent, onClick, icon: Icon, trend }) {
  return (
    <Grid size={{ xs: 6, md: 3 }}>
      <Paper
        variant="outlined"
        onClick={onClick}
        sx={{
          p: { xs: 1.75, sm: 2.5 },
          position: "relative",
          overflow: "hidden",
          cursor: onClick ? "pointer" : "default",
          transition: "box-shadow 0.15s ease, transform 0.15s ease",
          "&:hover": onClick
            ? {
                boxShadow: "0 8px 20px rgba(28,20,32,0.1)",
                transform: "translateY(-2px)",
              }
            : {},
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.02em",
                fontSize: { xs: 11, sm: 12 },
              }}
            >
              {label}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: 20, sm: 28 },
                mt: 0.5,
                color: accent ? "error.main" : "primary.main",
              }}
            >
              {value}
            </Typography>
          </Box>
          {Icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: accent
                  ? "rgba(122,32,54,0.1)"
                  : "rgba(184,112,63,0.14)",
              }}
            >
              <Icon
                sx={{
                  fontSize: 20,
                  color: accent ? "error.main" : "secondary.dark",
                }}
              />
            </Box>
          )}
        </Stack>
        {trend && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ mt: 1.25 }}
          >
            {trend.up ? (
              <TrendingUpIcon sx={{ fontSize: 15, color: "success.main" }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 15, color: "error.main" }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trend.up ? "success.main" : "error.main",
                fontWeight: 700,
              }}
            >
              {trend.pct}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs last week
            </Typography>
          </Stack>
        )}
      </Paper>
    </Grid>
  );
}

function OrderAccordion({
  order: o,
  products,
  onCopy,
  onStatusChange,
  canEditOrders = true,
}) {
  const c = o.customer || {};
  const isPaid = o.paymentMethod !== "cod";
  const status = o.fulfillmentStatus || "pending";
  const meta = getStatusMeta(status);
  const isCancelled = status === "cancelled";

  const productImage = (productId) =>
    products?.find((p) => p.id === productId)?.images?.[0];

  const addressLines = [
    c.address,
    [c.city, c.state].filter(Boolean).join(", "),
    c.pincode,
  ].filter(Boolean);

  function copyShippingDetails(e) {
    e.stopPropagation();
    navigator.clipboard
      ?.writeText(buildShippingText(o))
      .then(onCopy)
      .catch(() => {});
  }

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
          {/* Stacked thumbnail preview — a quick visual of what's in the order */}
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
            <Typography variant="caption" color="text.secondary" noWrap>
              {c.name || "—"} ·{" "}
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

        {!isCancelled && <OrderProgressTracker status={status} />}

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          rowGap={1}
          sx={{ mb: 2.5, mt: isCancelled ? 0 : 3, flexWrap: "wrap" }}
        >
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              disabled={!canEditOrders}
            >
              {STATUS_ORDER.map((s) => (
                <MenuItem key={s} value={s}>
                  {STATUS_META[s].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Print">
              <IconButton size="small" onClick={() => printOrder(o)}>
                <PrintOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton size="small" onClick={() => downloadOrder(o)}>
                <DownloadOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography
                variant="overline"
                sx={{
                  color: "secondary.dark",
                  fontWeight: 700,
                  fontSize: 11.5,
                }}
              >
                Ship to
              </Typography>
              <Button
                size="small"
                onClick={copyShippingDetails}
                sx={{ fontSize: 12, minWidth: "auto", p: 0.5 }}
              >
                Copy
              </Button>
            </Stack>
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>
              {c.name || "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {c.phone || "—"}
            </Typography>
            {c.email && (
              <Typography variant="body2" color="text.secondary">
                {c.email}
              </Typography>
            )}
            {addressLines.length > 0 ? (
              <Box sx={{ mt: 0.5 }}>
                {addressLines.map((line, i) => (
                  <Typography key={i} variant="body2" color="text.secondary">
                    {line}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                No address on file
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12, sm: 7 }}>
            <Typography
              variant="overline"
              sx={{ color: "secondary.dark", fontWeight: 700, fontSize: 11.5 }}
            >
              Items
            </Typography>
            <Stack spacing={1.25} sx={{ mb: 1.5, mt: 0.5 }}>
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
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

function AdminLoginPage({
  onExit,
  login,
  submitMfaCode,
  mfaChallengePending,
  error,
  clearError,
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    await login(identifier, password);
    setSubmitting(false);
  }

  async function submitMfa(e) {
    e.preventDefault();
    setSubmitting(true);
    await submitMfaCode(mfaCode);
    setSubmitting(false);
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "primary.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Paper sx={{ p: { xs: 3.5, sm: 5 }, width: "100%", maxWidth: 400 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Logo size={38} wordmarkSize={19} variant="dark" />
        </Box>
        <Typography
          variant="h5"
          sx={{ textAlign: "center", fontSize: 22, mb: 0.5 }}
        >
          Admin sign in
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", mb: 3 }}
        >
          {mfaChallengePending
            ? "Enter the 6-digit code from your authenticator app."
            : "Manage products, prices and orders."}
        </Typography>

        {mfaChallengePending ? (
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
        ) : (
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              <TextField
                autoFocus
                fullWidth
                label="Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              <PasswordField
                fullWidth
                label="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
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
          </Box>
        )}
        {!mfaChallengePending && <ForgotPasswordInline />}
        <Button fullWidth color="inherit" onClick={onExit} sx={{ mt: 1.5 }}>
          ← Back to store
        </Button>
      </Paper>
    </Box>
  );
}

function ForgotPasswordInline() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch(`${paymentConfig.backendBaseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email }),
      });
    } catch (_) {}
    setSent(true);
    setBusy(false);
  }

  if (!open) {
    return (
      <Button
        fullWidth
        size="small"
        onClick={() => setOpen(true)}
        sx={{ mt: 0.5 }}
      >
        Forgot password?
      </Button>
    );
  }

  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: "background.default", borderRadius: 2 }}>
      {sent ? (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          If an admin account exists for that email, a reset link has been sent.
        </Typography>
      ) : (
        <Box component="form" onSubmit={submit}>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Enter your admin email to receive a reset link.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Admin email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 1.5 }}
          />
          <Stack direction="row" spacing={1}>
            <Button size="small" color="inherit" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              type="submit"
              disabled={busy || !email}
            >
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

function CustomerActions({
  customer,
  onStatusChange,
  onDelete,
  canManage = true,
}) {
  const { status } = customer;
  if (!canManage) return null;
  return (
    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
      {status !== "active" && (
        <Tooltip title="Reactivate">
          <IconButton
            size="small"
            color="success"
            onClick={() => onStatusChange(customer.id, "active")}
          >
            <CheckCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {status !== "suspended" && (
        <Tooltip title="Suspend (temporary)">
          <IconButton
            size="small"
            onClick={() => onStatusChange(customer.id, "suspended")}
          >
            <PauseCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {status !== "deactivated" && (
        <Tooltip title="Deactivate (blocks sign-in)">
          <IconButton
            size="small"
            color="error"
            onClick={() => onStatusChange(customer.id, "deactivated")}
          >
            <BlockIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Delete permanently">
        <IconButton size="small" color="error" onClick={onDelete}>
          <PersonRemoveOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

function CustomerCard({
  customer,
  onStatusChange,
  onDelete,
  canManage = true,
}) {
  const meta =
    CUSTOMER_STATUS_META[customer.status] || CUSTOMER_STATUS_META.active;
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }} noWrap>
            {customer.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {customer.email || customer.phone}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Joined {new Date(customer.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={meta.label}
          sx={{
            bgcolor: meta.bg,
            color: meta.color,
            fontWeight: 700,
            flexShrink: 0,
          }}
        />
      </Stack>
      <Divider sx={{ my: 1.5 }} />
      <CustomerActions
        customer={customer}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
        canManage={canManage}
      />
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Team Section — roles and admin user management (super admin only)
// ---------------------------------------------------------------------------

const EMPTY_ROLE_FORM = { name: "", permissions: {} };
const EMPTY_USER_FORM = { name: "", email: "", password: "", roleId: "" };

function TeamSection({ token, onSessionExpired }) {
  const [tab, setTab] = useState(0);

  // Roles state
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleDialog, setRoleDialog] = useState(false);
  const [roleForm, setRoleForm] = useState(EMPTY_ROLE_FORM);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState("");

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userDialog, setUserDialog] = useState(false);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState("");

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const data = await api("/api/admin/roles", { token });
      setRoles(data);
    } catch (err) {
      if (err.status === 401) onSessionExpired();
    } finally {
      setRolesLoading(false);
    }
  }, [token, onSessionExpired]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await api("/api/admin/team", { token });
      setUsers(data);
    } catch (err) {
      if (err.status === 401) onSessionExpired();
    } finally {
      setUsersLoading(false);
    }
  }, [token, onSessionExpired]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Role dialog handlers
  function openAddRole() {
    setEditingRoleId(null);
    setRoleForm(EMPTY_ROLE_FORM);
    setRoleError("");
    setRoleDialog(true);
  }

  function openEditRole(role) {
    setEditingRoleId(role.id);
    setRoleForm({ name: role.name, permissions: role.permissions || {} });
    setRoleError("");
    setRoleDialog(true);
  }

  async function saveRole() {
    if (!roleForm.name.trim()) {
      setRoleError("Name is required");
      return;
    }
    setRoleSaving(true);
    setRoleError("");
    try {
      if (editingRoleId) {
        await api(`/api/admin/roles/${editingRoleId}`, {
          token,
          method: "PUT",
          body: { name: roleForm.name, permissions: roleForm.permissions },
        });
      } else {
        await api("/api/admin/roles", {
          token,
          method: "POST",
          body: { name: roleForm.name, permissions: roleForm.permissions },
        });
      }
      setRoleDialog(false);
      await loadRoles();
    } catch (err) {
      setRoleError(err.message);
    } finally {
      setRoleSaving(false);
    }
  }

  async function deleteRole(id) {
    if (
      !window.confirm(
        "Delete this role? Users assigned to it will lose their role.",
      )
    )
      return;
    try {
      await api(`/api/admin/roles/${id}`, { token, method: "DELETE" });
      await loadRoles();
    } catch (err) {
      alert(err.message);
    }
  }

  // User dialog handlers
  function openAddUser() {
    setEditingUserId(null);
    setUserForm(EMPTY_USER_FORM);
    setUserError("");
    setUserDialog(true);
  }

  function openEditUser(user) {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      password: "",
      roleId: user.role_id || "",
      isActive: user.is_active,
    });
    setUserError("");
    setUserDialog(true);
  }

  async function saveUser() {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      setUserError("Name and email are required");
      return;
    }
    if (!editingUserId && !userForm.password) {
      setUserError("Password is required");
      return;
    }
    setUserSaving(true);
    setUserError("");
    try {
      if (editingUserId) {
        const body = {
          name: userForm.name,
          email: userForm.email,
          roleId: userForm.roleId || null,
          isActive: userForm.isActive,
        };
        await api(`/api/admin/team/${editingUserId}`, {
          token,
          method: "PUT",
          body,
        });
      } else {
        await api("/api/admin/team", {
          token,
          method: "POST",
          body: {
            name: userForm.name,
            email: userForm.email,
            password: userForm.password,
            roleId: userForm.roleId || null,
          },
        });
      }
      setUserDialog(false);
      await loadUsers();
    } catch (err) {
      setUserError(err.message);
    } finally {
      setUserSaving(false);
    }
  }

  async function deleteUser(id) {
    if (!window.confirm("Delete this admin user? This cannot be undone."))
      return;
    try {
      await api(`/api/admin/team/${id}`, { token, method: "DELETE" });
      await loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  function togglePerm(perm) {
    setRoleForm((f) => ({
      ...f,
      permissions: { ...f.permissions, [perm]: !f.permissions[perm] },
    }));
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 26 }, mb: 2.5 }}>
        Team
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Roles" />
        <Tab label="Users" />
      </Tabs>

      {/* Roles tab */}
      {tab === 0 && (
        <Box>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAddRole}
            >
              Add role
            </Button>
          </Stack>

          {rolesLoading ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : roles.length === 0 ? (
            <Typography color="text.secondary">No roles yet.</Typography>
          ) : (
            <Paper variant="outlined" sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                      <TableCell>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {Object.entries(r.permissions || {})
                            .filter(([, v]) => v)
                            .map(([k]) => (
                              <Chip
                                key={k}
                                size="small"
                                label={PERM_LABELS[k] || k}
                                sx={{
                                  fontSize: 11,
                                  bgcolor: "rgba(184,112,63,0.12)",
                                  color: "secondary.dark",
                                  fontWeight: 600,
                                }}
                              />
                            ))}
                          {Object.values(r.permissions || {}).filter(Boolean)
                            .length === 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              No permissions
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => openEditRole(r)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteRole(r.id)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      )}

      {/* Users tab */}
      {tab === 1 && (
        <Box>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAddUser}
            >
              Add user
            </Button>
          </Stack>

          {usersLoading ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : users.length === 0 ? (
            <Typography color="text.secondary">No team members yet.</Typography>
          ) : (
            <Paper variant="outlined" sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        {u.role_name ? (
                          <Chip
                            size="small"
                            label={u.role_name}
                            sx={{
                              bgcolor: "rgba(184,112,63,0.12)",
                              color: "secondary.dark",
                              fontWeight: 600,
                              fontSize: 11,
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={u.is_active ? "Active" : "Inactive"}
                          sx={{
                            bgcolor: u.is_active
                              ? "rgba(74,122,82,0.12)"
                              : "rgba(122,32,54,0.1)",
                            color: u.is_active ? "success.main" : "error.main",
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => openEditUser(u)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteUser(u.id)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      )}

      {/* Role dialog */}
      <Dialog
        open={roleDialog}
        onClose={() => setRoleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingRoleId ? "Edit role" : "Add role"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            label="Role name"
            value={roleForm.name}
            onChange={(e) =>
              setRoleForm((f) => ({ ...f, name: e.target.value }))
            }
            sx={{ mt: 1, mb: 2 }}
          />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Permissions
          </Typography>
          <FormGroup>
            {Object.entries(PERM_LABELS).map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    size="small"
                    checked={!!roleForm.permissions[key]}
                    onChange={() => togglePerm(key)}
                  />
                }
                label={<Typography variant="body2">{label}</Typography>}
              />
            ))}
          </FormGroup>
          {roleError && (
            <Typography color="error.main" variant="body2" sx={{ mt: 1.5 }}>
              {roleError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setRoleDialog(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveRole} disabled={roleSaving}>
            {roleSaving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User dialog */}
      <Dialog
        open={userDialog}
        onClose={() => setUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingUserId ? "Edit user" : "Add user"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Name"
              value={userForm.name}
              onChange={(e) =>
                setUserForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <TextField
              fullWidth
              size="small"
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm((f) => ({ ...f, email: e.target.value }))
              }
            />
            {!editingUserId && (
              <TextField
                fullWidth
                size="small"
                label="Password"
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            )}
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={userForm.roleId || ""}
                onChange={(e) =>
                  setUserForm((f) => ({ ...f, roleId: e.target.value }))
                }
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {editingUserId && (
              <FormControlLabel
                control={
                  <Switch
                    checked={!!userForm.isActive}
                    onChange={(e) =>
                      setUserForm((f) => ({ ...f, isActive: e.target.checked }))
                    }
                  />
                }
                label="Active"
              />
            )}
          </Stack>
          {userError && (
            <Typography color="error.main" variant="body2" sx={{ mt: 1.5 }}>
              {userError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setUserDialog(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveUser} disabled={userSaving}>
            {userSaving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
