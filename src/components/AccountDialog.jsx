import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx';

const EMPTY_LOGIN = { identifier: '', password: '' };
const EMPTY_REGISTER = { name: '', email: '', phone: '', password: '' };

export default function AccountDialog({ open, onClose }) {
  const { login, register, error, clearError } = useCustomerAuth();
  const [tab, setTab] = useState(0); // 0 = sign in, 1 = create account
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER);
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    clearError();
    setLoginForm(EMPTY_LOGIN);
    setRegisterForm(EMPTY_REGISTER);
    onClose();
  }

  async function submitLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(loginForm.identifier, loginForm.password);
    setSubmitting(false);
    if (ok) handleClose();
  }

  async function submitRegister(e) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await register(registerForm);
    setSubmitting(false);
    if (ok) handleClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontFamily: "'Playfair Display', serif" }}>Your account</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_e, v) => { setTab(v); clearError(); }} sx={{ mb: 2 }}>
          <Tab label="Sign in" />
          <Tab label="Create account" />
        </Tabs>

        {tab === 0 ? (
          <Box component="form" onSubmit={submitLogin}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Sign in to see your past orders and track current ones.
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                autoFocus fullWidth size="small" label="Email or phone"
                value={loginForm.identifier}
                onChange={(e) => setLoginForm((f) => ({ ...f, identifier: e.target.value }))}
              />
              <TextField
                fullWidth size="small" type="password" label="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                error={!!error}
                helperText={error || ' '}
              />
            </Stack>
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 1 }} disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={submitRegister}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create an account to track orders across any device.
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                autoFocus fullWidth size="small" label="Full name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm((f) => ({ ...f, name: e.target.value }))}
              />
              <TextField
                fullWidth size="small" label="Email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
              />
              <TextField
                fullWidth size="small" label="Phone"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <TextField
                fullWidth size="small" type="password" label="Password" helperText="At least 6 characters"
                value={registerForm.password}
                onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
              />
              {error && <Typography variant="body2" color="error.main">{error}</Typography>}
            </Stack>
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 1.5 }} disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
