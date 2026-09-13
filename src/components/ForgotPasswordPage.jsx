import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useStore } from '../context/StoreContext.jsx';
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import Logo from './Logo.jsx';

export default function ForgotPasswordPage() {
  const { categories } = useStore();
  const { requestPasswordReset, error, clearError } = useCustomerAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await requestPasswordReset(identifier);
    setSubmitting(false);
    if (ok) setSent(true);
  }

  function goHome() { navigate('/'); }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header categories={categories} onOpenCart={goHome} onSelectCategory={goHome} />
      <Box component="main" sx={{ flex: 1, bgcolor: 'background.default', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="sm">
          <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4.5 } }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
              <Logo size={36} wordmarkSize={18} variant="dark" />
            </Box>
            <Typography variant="h5" sx={{ textAlign: 'center', mb: 1 }}>Reset your password</Typography>

            {sent ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                If an account exists for that email, a reset link has been sent — check your inbox
                (and spam folder). The link expires in 1 hour.
              </Typography>
            ) : (
              <Box component="form" onSubmit={submit}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Enter the email on your account and we'll send you a reset link.
                </Typography>
                <TextField
                  autoFocus fullWidth label="Email"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); if (error) clearError(); }}
                  error={!!error} helperText={error || ' '}
                />
                <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 1 }} disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send reset link'}
                </Button>
              </Box>
            )}

            <Button fullWidth size="small" onClick={() => navigate('/')} sx={{ mt: 2 }}>
              ← Back to store
            </Button>
          </Paper>
        </Container>
      </Box>
      <Footer onSelectCategory={goHome} />
    </Box>
  );
}
