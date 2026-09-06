import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CircularProgress from '@mui/material/CircularProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx';
import { formatINR } from '../utils/storage.js';
import { getStatusMeta } from '../utils/orderStatus.js';
import paymentConfig from '../config/payment.js';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import Logo from './Logo.jsx';

const EMPTY_LOGIN = { identifier: '', password: '' };
const EMPTY_REGISTER = { name: '', email: '', phone: '', password: '' };

/**
 * A real page (not a dialog) for customers: shows the sign-in/create-account
 * form when logged out, and order history with live status when logged in.
 * This is a normal-user surface — deliberately no print/download/copy
 * actions here (those exist only in the Admin Dashboard).
 */
export default function AccountPage({ onExit, categories, onOpenCart, onSelectCategory, onOpenAdmin }) {
  const { isLoggedIn } = useCustomerAuth();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        categories={categories}
        onOpenCart={onOpenCart}
        onOpenAdmin={onOpenAdmin}
        onSelectCategory={onSelectCategory}
        onOpenAccount={onExit}
      />
      <Box component="main" sx={{ flex: 1, bgcolor: 'background.default', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="sm">
          {isLoggedIn ? <OrderHistory /> : <AuthForm />}
        </Container>
      </Box>
      <Footer onSelectCategory={onSelectCategory} />
    </Box>
  );
}

function AuthForm() {
  const { login, register, error, clearError } = useCustomerAuth();
  const [tab, setTab] = useState(0);
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER);
  const [submitting, setSubmitting] = useState(false);

  async function submitLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    await login(loginForm.identifier, loginForm.password);
    setSubmitting(false);
  }

  async function submitRegister(e) {
    e.preventDefault();
    setSubmitting(true);
    await register(registerForm);
    setSubmitting(false);
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4.5 } }}>
      <Stack alignItems="center" sx={{ mb: 3 }}>
        <Logo size={36} wordmarkSize={18} variant="dark" />
      </Stack>
      <Tabs value={tab} onChange={(_e, v) => { setTab(v); clearError(); }} centered sx={{ mb: 3 }}>
        <Tab label="Sign in" />
        <Tab label="Create account" />
      </Tabs>

      {tab === 0 ? (
        <Box component="form" onSubmit={submitLogin}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            Sign in to see your past orders and track current ones.
          </Typography>
          <Stack spacing={2}>
            <TextField
              autoFocus fullWidth label="Email or phone"
              value={loginForm.identifier}
              onChange={(e) => setLoginForm((f) => ({ ...f, identifier: e.target.value }))}
            />
            <TextField
              fullWidth type="password" label="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
              error={!!error}
              helperText={error || ' '}
            />
          </Stack>
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 1 }} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={submitRegister}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            Create an account to track orders across any device.
          </Typography>
          <Stack spacing={2}>
            <TextField
              autoFocus fullWidth label="Full name"
              value={registerForm.name}
              onChange={(e) => setRegisterForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              fullWidth label="Email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
            />
            <TextField
              fullWidth label="Phone"
              value={registerForm.phone}
              onChange={(e) => setRegisterForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <TextField
              fullWidth type="password" label="Password" helperText="At least 6 characters"
              value={registerForm.password}
              onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
            />
            {error && <Typography variant="body2" color="error.main">{error}</Typography>}
          </Stack>
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </Box>
      )}
    </Paper>
  );
}

function OrderHistory() {
  const { token, customer, logout } = useCustomerAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${paymentConfig.backendBaseUrl}/api/customer/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Could not load your orders');
        const data = await res.json();
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: 26 }}>My orders</Typography>
          <Typography variant="body2" color="text.secondary">
            {customer?.name} · {customer?.email || customer?.phone}
          </Typography>
        </Box>
        <Button size="small" color="inherit" onClick={logout}>Sign out</Button>
      </Stack>

      {orders === null && !error && (
        <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress size={28} /></Stack>
      )}
      {error && <Typography color="error.main">{error}</Typography>}
      {orders && orders.length === 0 && (
        <Typography color="text.secondary">No orders yet — once you place one, it'll show up here.</Typography>
      )}

      {orders && orders.length > 0 && (
        <Stack spacing={1.25}>
          {orders.map((o) => <CustomerOrderAccordion key={o.id} order={o} />)}
        </Stack>
      )}
    </Box>
  );
}

function CustomerOrderAccordion({ order: o }) {
  const status = o.fulfillmentStatus || 'confirmed';
  const meta = getStatusMeta(status);
  const isPaid = o.paymentMethod !== 'cod';

  return (
    <Accordion variant="outlined" disableGutters sx={{ '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={0.5} sx={{ width: '100%', pr: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }} noWrap>{o.id}</Typography>
            <Typography variant="caption" color="text.secondary">{new Date(o.date).toLocaleDateString()}</Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip size="small" label={meta.label} sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{formatINR(o.total)}</Typography>
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Divider sx={{ mb: 1.5 }} />
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
      </AccordionDetails>
    </Accordion>
  );
}
