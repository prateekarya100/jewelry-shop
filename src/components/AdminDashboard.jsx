import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { useStore } from '../context/StoreContext.jsx';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { formatINR } from '../utils/storage.js';
import { STATUS_META, STATUS_ORDER, getStatusMeta } from '../utils/orderStatus.js';
import { buildShippingText, printOrder, downloadOrder } from '../utils/orderExport.js';
import paymentConfig from '../config/payment.js';
import Logo from './Logo.jsx';

const EMPTY_FORM = {
  title: '', category: '', tagline: '', description: '',
  price: '', discount: '', images: '', video: '', material: '', stock: '',
};

const NAV = [
  { key: 'overview', label: 'Overview', icon: DashboardOutlinedIcon },
  { key: 'products', label: 'Products', icon: Inventory2OutlinedIcon },
  { key: 'orders', label: 'Orders', icon: ReceiptLongOutlinedIcon },
];

const DATE_FILTERS = [
  { value: 'all', label: 'All time' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

async function api(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${paymentConfig.backendBaseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
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
  const { isAdmin, login, error, clearError, token, logout } = useAdminAuth();
  const isMobile = useMediaQuery('(max-width:820px)');
  const [nav, setNav] = useState('overview');
  const [productPage, setProductPage] = useState('list'); // 'list' | 'form'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [backendOrders, setBackendOrders] = useState(null); // null until first backend fetch resolves

  // Order filters
  const [dateFilter, setDateFilter] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => { if (isAdmin) refreshProducts(); }, [isAdmin, refreshProducts]);

  // Orders come from the shared backend when one is configured — that's
  // what makes status changes here visible in the customer's own "My
  // Orders" view on their own device. Falls back to this browser's local
  // order history if no backend is configured (offline/demo mode).
  const loadOrders = useCallback(async () => {
    if (!paymentConfig.backendBaseUrl || !isAdmin) return;
    try {
      const data = await api('/api/admin/orders', { token });
      setBackendOrders(data);
    } catch (err) {
      if (err.status === 401) { handleSessionExpired(); return; }
      console.warn('Could not load orders from backend:', err);
      setBackendOrders([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const orders = paymentConfig.backendBaseUrl ? (backendOrders || []) : localOrders;

  async function handleStatusChange(orderId, status) {
    if (!paymentConfig.backendBaseUrl) {
      notify('Connect a backend (src/config/payment.js) to change order status.');
      return;
    }
    try {
      await api(`/api/admin/orders/${orderId}/status`, { token, method: 'PUT', body: { status } });
      await loadOrders();
      notify('Order status updated');
    } catch (err) {
      if (err.status === 401) { handleSessionExpired(); return; }
      notify(err.message);
    }
  }

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    const lowStock = products.filter((p) => (p.stock ?? 0) <= 5).length;
    return {
      productCount: products.length,
      orderCount: orders.length,
      revenue,
      lowStock,
    };
  }, [products, orders]);

  const filteredOrders = useMemo(() => {
    if (dateFilter === 'all') return orders;
    const now = new Date();
    return orders.filter((o) => {
      const d = new Date(o.date);
      if (dateFilter === 'week') {
        const from = new Date(now); from.setDate(now.getDate() - 7);
        return d >= from;
      }
      if (dateFilter === 'month') {
        const from = new Date(now); from.setMonth(now.getMonth() - 1);
        return d >= from;
      }
      if (dateFilter === 'year') {
        const from = new Date(now); from.setFullYear(now.getFullYear() - 1);
        return d >= from;
      }
      if (dateFilter === 'custom') {
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
    setFormError('');
    setProductPage('form');
  }

  function openEditForm(p) {
    setEditingId(p.id);
    setForm({
      title: p.title, category: p.category, tagline: p.tagline || '',
      description: p.description || '', price: p.price, discount: p.discount || 0,
      images: (p.images || []).join(', '), video: p.video || '',
      material: p.material || '', stock: p.stock ?? '',
    });
    setFormError('');
    setProductPage('form');
  }

  // If the backend rejects a request as unauthenticated (session expired,
  // most commonly because the backend restarted since you logged in —
  // sessions live in its memory, not on disk), sign out and bounce back to
  // the login screen with a clear reason, instead of failing silently
  // in a way that's easy to miss and looks like "my edit didn't save."
  function handleSessionExpired() {
    logout();
    onExit();
    notify('Your session expired — please sign in again.');
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.category.trim() || !form.price) {
      setFormError('Title, category and price are required.');
      return;
    }
    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      discount: Number(form.discount) || 0,
      images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
      video: form.video.trim(),
      material: form.material.trim(),
      stock: Number(form.stock) || 0,
    };
    if (payload.images.length === 0) {
      payload.images = ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=900&auto=format&fit=crop'];
    }
    setSaving(true);
    setFormError('');
    try {
      if (editingId) {
        await api(`/api/admin/products/${editingId}`, { token, method: 'PUT', body: payload });
        notify('Product updated');
      } else {
        await api('/api/admin/products', { token, method: 'POST', body: payload });
        notify('Product added — now live on the storefront');
      }
      await refreshProducts();
      setProductPage('list');
    } catch (err) {
      if (err.status === 401) { handleSessionExpired(); return; }
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api(`/api/admin/products/${id}`, { token, method: 'DELETE' });
      await refreshProducts();
      notify('Product removed');
    } catch (err) {
      if (err.status === 401) { handleSessionExpired(); return; }
      notify(err.message);
    }
  }

  if (!isAdmin) {
    return <AdminLoginPage onExit={onExit} login={login} error={error} clearError={clearError} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', pb: isMobile ? 7 : 0 }}>
      {/* Mobile top bar (replaces sidebar below 820px) */}
      {isMobile && (
        <Box sx={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
          bgcolor: 'primary.main', color: 'primary.contrastText',
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, borderBottom: '1px solid rgba(250,241,236,0.12)',
        }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Logo size={26} wordmarkSize={15} />
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View store">
              <IconButton size="small" onClick={onExit} sx={{ color: 'primary.contrastText' }}>
                <StorefrontOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Log out">
              <IconButton size="small" onClick={() => { logout(); onExit(); }} sx={{ color: 'primary.contrastText' }}>
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
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            flexDirection: 'column',
            py: 2.5,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ px: 2.5, mb: 3 }}>
            <Logo size={30} wordmarkSize={17} />
          </Stack>

          <List sx={{ flex: 1, px: 1.5 }}>
            {NAV.map((item) => (
              <ListItemButton
                key={item.key}
                selected={nav === item.key}
                onClick={() => setNav(item.key)}
                sx={{
                  borderRadius: 1.5, mb: 0.5, color: 'rgba(250,241,236,0.85)',
                  '&.Mui-selected': { bgcolor: 'rgba(250,241,236,0.12)', color: '#fff' },
                  '&:hover': { bgcolor: 'rgba(250,241,236,0.08)' },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  <item.icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>

          <Stack spacing={0.5} sx={{ px: 1.5 }}>
            <ListItemButton onClick={onExit} sx={{ borderRadius: 1.5, color: 'rgba(250,241,236,0.85)' }}>
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><StorefrontOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="View store" />
            </ListItemButton>
            <ListItemButton onClick={() => { logout(); onExit(); }} sx={{ borderRadius: 1.5, color: 'rgba(250,241,236,0.85)' }}>
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogoutOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Log out" />
            </ListItemButton>
          </Stack>
        </Box>
      )}

      {/* Main content */}
      <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5, md: 4 }, pt: isMobile ? 9 : { md: 4 }, maxWidth: 1200, overflowX: 'hidden', minWidth: 0 }}>
        {nav === 'overview' && (
          <Box>
            <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 26 }, mb: 3 }}>Overview</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <StatCard label="Products" value={stats.productCount} onClick={() => setNav('products')} />
              <StatCard label="Orders" value={stats.orderCount} onClick={() => setNav('orders')} />
              <StatCard label="Revenue (this device)" value={formatINR(stats.revenue)} />
              <StatCard label="Low stock (≤5)" value={stats.lowStock} accent={stats.lowStock > 0} onClick={() => setNav('products')} />
            </Grid>
            <Typography variant="h6" sx={{ fontSize: 18, mb: 1.5 }}>Recent orders</Typography>
            {orders.length === 0 ? (
              <Typography color="text.secondary">No orders yet.</Typography>
            ) : (
              <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
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
                        <TableRow key={o.id} hover onClick={() => setNav('orders')} sx={{ cursor: 'pointer' }}>
                          <TableCell>{o.id}</TableCell>
                          <TableCell>{o.customer.name}</TableCell>
                          <TableCell>
                            <Chip size="small" label={meta.label} sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="right">{formatINR(o.total)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        )}

        {nav === 'products' && productPage === 'list' && (
          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 26 } }}>Products</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAddForm}>Add product</Button>
            </Stack>

            {isMobile ? (
              <Stack spacing={1.25}>
                {products.map((p) => (
                  <Paper key={p.id} variant="outlined" sx={{ p: 1.5, display: 'flex', gap: 1.5 }}>
                    <Box component="img" src={p.images?.[0]} alt="" sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14.5 }} noWrap>{p.title}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {p.category} · Stock: {p.stock ?? '—'}
                      </Typography>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.75 }}>
                        <Stack direction="row" alignItems="baseline" spacing={0.75}>
                          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{formatINR(p.price)}</Typography>
                          {p.discount > 0 && (
                            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>-{p.discount}%</Typography>
                          )}
                        </Stack>
                        <Stack direction="row">
                          <IconButton size="small" onClick={() => openEditForm(p)}><EditOutlinedIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                        </Stack>
                      </Stack>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Paper variant="outlined">
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
                          <Box component="img" src={p.images?.[0]} alt="" sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1, display: 'block' }} />
                        </TableCell>
                        <TableCell>{p.title}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell align="right">{formatINR(p.price)}</TableCell>
                        <TableCell align="right">{p.discount ? `${p.discount}%` : '—'}</TableCell>
                        <TableCell align="right">{p.stock ?? '—'}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openEditForm(p)}><EditOutlinedIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        )}

        {nav === 'products' && productPage === 'form' && (
          <Box sx={{ maxWidth: 720 }}>
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => setProductPage('list')}
              sx={{ mb: 2, color: 'text.secondary', pl: 0 }}
            >
              Back to products
            </Button>
            <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 26 }, mb: 3 }}>
              {editingId ? 'Edit product' : 'Add a new product'}
            </Typography>
            <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Box component="form" onSubmit={submitForm}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Section / category" placeholder="e.g. Rings" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
                  </Grid>
                  <Grid size={12}>
                    <TextField fullWidth size="small" label="Tagline" value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
                  </Grid>
                  <Grid size={12}>
                    <TextField fullWidth size="small" label="Description" multiline minRows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField fullWidth size="small" type="number" label="Price (₹)" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField fullWidth size="small" type="number" label="Discount (%)" value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Material" value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} />
                  </Grid>
                  <Grid size={12}>
                    <TextField fullWidth size="small" label="Image URLs (comma separated)" placeholder="https://…, https://…" value={form.images} onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField fullWidth size="small" label="Demo video URL (.mp4 or YouTube)" value={form.video} onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" type="number" label="Stock" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
                  </Grid>
                </Grid>
                {formError && <Typography color="error.main" variant="body2" sx={{ mt: 2 }}>{formError}</Typography>}
                <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}>
                  <Button color="inherit" onClick={() => setProductPage('list')}>Cancel</Button>
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Box>
        )}

        {nav === 'orders' && (
          <Box>
            <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 26 }, mb: 2.5 }}>Orders</Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mb: dateFilter === 'custom' ? 1.5 : 3 }}>
              {DATE_FILTERS.map((f) => (
                <Chip
                  key={f.value}
                  label={f.label}
                  onClick={() => setDateFilter(f.value)}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: dateFilter === f.value ? 'primary.main' : 'background.paper',
                    color: dateFilter === f.value ? 'primary.contrastText' : 'text.primary',
                    border: '1px solid', borderColor: dateFilter === f.value ? 'primary.main' : 'divider',
                  }}
                />
              ))}
            </Stack>

            {dateFilter === 'custom' && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
                <TextField
                  size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
                  value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                />
                <TextField
                  size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
                  value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                />
              </Stack>
            )}

            {filteredOrders.length === 0 ? (
              <Typography color="text.secondary">No orders in this range.</Typography>
            ) : (
              <Stack spacing={1.25}>
                {filteredOrders.map((o) => (
                  <OrderAccordion
                    key={o.id}
                    order={o}
                    onCopy={() => notify('Shipping details copied')}
                    onStatusChange={(status) => handleStatusChange(o.id, status)}
                  />
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Box>

      {/* Mobile bottom navigation */}
      {isMobile && (
        <BottomNavigation
          value={nav}
          onChange={(_e, value) => setNav(value)}
          sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
            borderTop: '1px solid', borderColor: 'divider',
            height: 60,
          }}
        >
          {NAV.map((item) => (
            <BottomNavigationAction
              key={item.key}
              label={item.label}
              value={item.key}
              icon={<item.icon fontSize="small" />}
              sx={{ '&.Mui-selected': { color: 'secondary.dark' }, minWidth: 'auto' }}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
}

function StatCard({ label, value, accent, onClick }) {
  return (
    <Grid size={{ xs: 6, md: 3 }}>
      <Paper
        variant="outlined"
        onClick={onClick}
        sx={{
          p: { xs: 1.75, sm: 2.5 }, position: 'relative', overflow: 'hidden',
          borderLeft: '3px solid', borderLeftColor: accent ? 'error.main' : 'secondary.main',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'box-shadow 0.15s ease',
          '&:hover': onClick ? { boxShadow: '0 4px 14px rgba(28,20,32,0.1)' } : {},
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.02em', fontSize: { xs: 11, sm: 12 } }}>{label}</Typography>
        <Typography variant="h5" sx={{ fontSize: { xs: 20, sm: 28 }, mt: 0.5, color: accent ? 'error.main' : 'primary.main' }}>{value}</Typography>
      </Paper>
    </Grid>
  );
}

function OrderAccordion({ order: o, onCopy, onStatusChange }) {
  const c = o.customer || {};
  const isPaid = o.paymentMethod !== 'cod';
  const status = o.fulfillmentStatus || 'pending';
  const meta = getStatusMeta(status);

  const addressLines = [
    c.address,
    [c.city, c.state].filter(Boolean).join(', '),
    c.pincode,
  ].filter(Boolean);

  function copyShippingDetails(e) {
    e.stopPropagation();
    navigator.clipboard?.writeText(buildShippingText(o)).then(onCopy).catch(() => {});
  }

  return (
    <Accordion variant="outlined" disableGutters sx={{ '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row" alignItems="center" justifyContent="space-between"
          flexWrap="wrap" rowGap={0.5} sx={{ width: '100%', pr: 1 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }} noWrap>{o.id} · {c.name || '—'}</Typography>
            <Typography variant="caption" color="text.secondary">{new Date(o.date).toLocaleDateString()}</Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip size="small" label={meta.label} sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{formatINR(o.total)}</Typography>
          </Stack>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        <Divider sx={{ mb: 2 }} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={1} sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select value={status} onChange={(e) => onStatusChange(e.target.value)}>
              {STATUS_ORDER.map((s) => (
                <MenuItem key={s} value={s}>{STATUS_META[s].label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Print">
              <IconButton size="small" onClick={() => printOrder(o)}><PrintOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton size="small" onClick={() => downloadOrder(o)}><DownloadOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="overline" sx={{ color: 'secondary.dark', fontWeight: 700 }}>Ship to</Typography>
              <Button size="small" onClick={copyShippingDetails} sx={{ fontSize: 12, minWidth: 'auto', p: 0.5 }}>
                Copy
              </Button>
            </Stack>
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{c.name || '—'}</Typography>
            <Typography variant="body2" color="text.secondary">{c.phone || '—'}</Typography>
            {c.email && <Typography variant="body2" color="text.secondary">{c.email}</Typography>}
            {addressLines.length > 0 ? (
              <Box sx={{ mt: 0.5 }}>
                {addressLines.map((line, i) => (
                  <Typography key={i} variant="body2" color="text.secondary">{line}</Typography>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>No address on file</Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12, sm: 7 }}>
            <Typography variant="overline" sx={{ color: 'secondary.dark', fontWeight: 700 }}>Items</Typography>
            <Stack spacing={0.5} sx={{ mb: 1 }}>
              {o.items.map((i) => (
                <Stack key={i.productId} direction="row" justifyContent="space-between" sx={{ fontSize: 14 }}>
                  <Typography variant="body2">{i.title} × {i.qty}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatINR(i.unitPrice * i.qty)}</Typography>
                </Stack>
              ))}
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {isPaid ? (o.paymentRef ? `Ref: ${o.paymentRef}` : 'Paid') : 'Cash on delivery'}
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{formatINR(o.total)}</Typography>
            </Stack>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

function AdminLoginPage({ onExit, login, error, clearError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    await login(username, password);
    setSubmitting(false);
  }

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: 'primary.main', display: 'flex',
      alignItems: 'center', justifyContent: 'center', p: 3,
    }}>
      <Paper sx={{ p: { xs: 3.5, sm: 5 }, width: '100%', maxWidth: 400 }}>
        <Stack alignItems="center" sx={{ mb: 3 }}>
          <Logo size={38} wordmarkSize={19} variant="dark" />
        </Stack>
        <Typography variant="h5" sx={{ textAlign: 'center', fontSize: 22, mb: 0.5 }}>Admin sign in</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          Manage products, prices and orders.
        </Typography>
        <Box component="form" onSubmit={submit}>
          <Stack spacing={2}>
            <TextField
              autoFocus fullWidth label="Username" value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              fullWidth type="password" label="Password" value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }}
              error={!!error}
              helperText={error || ' '}
            />
          </Stack>
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 1 }} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </Box>
        <Button fullWidth color="inherit" onClick={onExit} sx={{ mt: 1.5 }}>
          ← Back to store
        </Button>
      </Paper>
    </Box>
  );
}
