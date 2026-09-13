import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { formatINR } from '../utils/storage.js';
import { getStatusMeta } from '../utils/orderStatus.js';
import paymentConfig from '../config/payment.js';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import Logo from './Logo.jsx';
import OrderProgressTracker from './OrderProgressTracker.jsx';

const EMPTY_LOGIN = { identifier: '', password: '' };
const EMPTY_REGISTER = { name: '', email: '', phone: '', password: '' };

export default function AccountPage({ onExit, categories, onOpenCart, onSelectCategory }) {
  const { isLoggedIn } = useCustomerAuth();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        categories={categories}
        onOpenCart={onOpenCart}
        onSelectCategory={onSelectCategory}
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
  const {
    login, submitMfaCode, mfaChallengePending,
    startRegister, verifyRegisterOtp, resendRegistrationOtp, cancelPendingRegistration, pendingRegistrationEmail,
    error, clearError,
  } = useCustomerAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER);
  const [mfaCode, setMfaCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
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
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>Two-factor verification</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          Enter the 6-digit code from your authenticator app.
        </Typography>
        <Box component="form" onSubmit={submitMfa}>
          <TextField
            autoFocus fullWidth label="6-digit code" value={mfaCode}
            onChange={(e) => { setMfaCode(e.target.value); if (error) clearError(); }}
            error={!!error} helperText={error || ' '}
            inputProps={{ inputMode: 'numeric', maxLength: 6 }}
          />
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 1 }} disabled={submitting}>
            {submitting ? 'Verifying…' : 'Verify'}
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
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>Verify your email</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          We sent a 6-digit code to <strong>{pendingRegistrationEmail}</strong>. It expires in 10 minutes.
        </Typography>
        <Box component="form" onSubmit={submitVerifyOtp}>
          <TextField
            autoFocus fullWidth label="6-digit code" value={otpCode}
            onChange={(e) => { setOtpCode(e.target.value); if (error) clearError(); }}
            error={!!error} helperText={error || ' '}
            inputProps={{ inputMode: 'numeric', maxLength: 6 }}
          />
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 1 }} disabled={submitting || otpCode.length !== 6}>
            {submitting ? 'Verifying…' : 'Verify & create account'}
          </Button>
        </Box>
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
          <Button size="small" color="inherit" onClick={cancelPendingRegistration}>
            ← Back
          </Button>
          <Button size="small" onClick={handleResend} disabled={resendCooldown > 0 || submitting}>
            {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
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
          <Button fullWidth size="small" onClick={() => navigate('/forgot-password')} sx={{ mt: 1 }}>
            Forgot password?
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={submitStartRegister}>
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
              fullWidth label="Email" type="email" required
              value={registerForm.email}
              onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
              helperText="Required — we'll send a verification code here"
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
            {submitting ? 'Sending code…' : 'Send verification code'}
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
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${paymentConfig.backendBaseUrl}/api/orders/mine`, {
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
      </Stack>

      <SecuritySection />

      <Typography variant="h6" sx={{ fontSize: 18, mt: 4, mb: 1.5 }}>Order history</Typography>

      {orders === null && !error && (
        <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress size={28} /></Stack>
      )}
      {error && <Typography color="error.main">{error}</Typography>}
      {orders && orders.length === 0 && (
        <Typography color="text.secondary">No orders yet — once you place one, it'll show up here.</Typography>
      )}

      {orders && orders.length > 0 && (
        <Stack spacing={1.25}>
          {orders.map((o) => <CustomerOrderAccordion key={o.id} order={o} products={products} />)}
        </Stack>
      )}
    </Box>
  );
}

function SecuritySection() {
  const { customer, setup2fa, confirm2fa, disable2fa } = useCustomerAuth();
  const [setupOpen, setSetupOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function startSetup() {
    setError('');
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
    setError('');
    try {
      await confirm2fa(code);
      setSetupOpen(false);
      setCode('');
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
      <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="space-between" flexWrap="wrap" rowGap={1.5}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ShieldOutlinedIcon sx={{ color: 'secondary.dark' }} />
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Two-factor authentication</Typography>
            <Typography variant="body2" color="text.secondary">
              {customer?.mfaEnabled ? 'Enabled — extra code required at sign in.' : 'Add an extra layer of security to your account.'}
            </Typography>
          </Box>
        </Stack>
        {customer?.mfaEnabled ? (
          <Button size="small" color="error" onClick={handleDisable} disabled={busy}>Disable</Button>
        ) : (
          <Button size="small" variant="outlined" onClick={startSetup} disabled={busy}>Enable</Button>
        )}
      </Stack>

      <Dialog open={setupOpen} onClose={() => setSetupOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set up two-factor authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Scan this QR code with Google Authenticator, Authy, or any TOTP app, then enter
            the 6-digit code it shows.
          </Typography>
          {qrCode && <Box component="img" src={qrCode} alt="2FA QR code" sx={{ display: 'block', mx: 'auto', mb: 2, width: 200, height: 200 }} />}
          <Box component="form" onSubmit={confirmSetup}>
            <TextField
              fullWidth autoFocus label="6-digit code" value={code}
              onChange={(e) => setCode(e.target.value)}
              error={!!error} helperText={error || ' '}
              inputProps={{ inputMode: 'numeric', maxLength: 6 }}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 1 }} disabled={busy}>
              {busy ? 'Confirming…' : 'Confirm & enable'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Paper>
  );
}

function CustomerOrderAccordion({ order: o, products }) {
  const status = o.fulfillmentStatus || 'confirmed';
  const meta = getStatusMeta(status);
  const isPaid = o.paymentMethod !== 'cod';
  const isCancelled = status === 'cancelled';
  const productImage = (productId) => products?.find((p) => p.id === productId)?.images?.[0];

  return (
    <Accordion variant="outlined" disableGutters sx={{ '&:before': { display: 'none' }, borderRadius: 2, overflow: 'hidden' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 0.5 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 1 }}>
          <Stack direction="row" sx={{ flexShrink: 0 }}>
            {o.items.slice(0, 3).map((item, idx) => (
              <Box
                key={item.productId}
                component="img"
                src={productImage(item.productId) || undefined}
                alt=""
                sx={{
                  width: 40, height: 40, borderRadius: '10px', objectFit: 'cover',
                  border: '2px solid #fff', bgcolor: 'grey.100',
                  ml: idx === 0 ? 0 : -1.5, boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                  position: 'relative', zIndex: 3 - idx,
                }}
              />
            ))}
          </Stack>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }} noWrap>{o.id}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Typography>
          </Box>
          <Stack alignItems="flex-end" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Chip size="small" label={meta.label} sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: 11.5 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{formatINR(o.total)}</Typography>
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, bgcolor: 'rgba(184,112,63,0.03)' }}>
        <Divider sx={{ mb: 2.5 }} />

        {!isCancelled && (
          <Box sx={{ mb: 3 }}>
            <OrderProgressTracker status={status} />
          </Box>
        )}

        <Stack spacing={1.25} sx={{ mb: 1.5 }}>
          {o.items.map((i) => (
            <Stack key={i.productId} direction="row" alignItems="center" spacing={1.5}>
              <Box
                component="img"
                src={productImage(i.productId) || undefined}
                alt=""
                sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover', bgcolor: 'grey.100', flexShrink: 0 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{i.title}</Typography>
                <Typography variant="caption" color="text.secondary">Qty {i.qty}</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, flexShrink: 0 }}>{formatINR(i.unitPrice * i.qty)}</Typography>
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
