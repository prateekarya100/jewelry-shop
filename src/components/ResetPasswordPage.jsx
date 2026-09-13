import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

export default function ResetPasswordPage() {
  const { categories } = useStore();
  const { resetPassword, error, clearError } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await resetPassword(token, password);
    setSubmitting(false);
    if (ok) setDone(true);
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
            <Typography variant="h5" sx={{ textAlign: 'center', mb: 1 }}>Choose a new password</Typography>

            {!token ? (
              <Typography color="error.main" sx={{ textAlign: 'center', mt: 2 }}>
                This link is missing its reset token — please use the link from your email.
              </Typography>
            ) : done ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2, mb: 2 }}>
                  Your password has been updated. You can sign in with it now.
                </Typography>
                <Button fullWidth variant="contained" onClick={() => navigate('/account')}>
                  Go to sign in
                </Button>
              </>
            ) : (
              <Box component="form" onSubmit={submit}>
                <TextField
                  autoFocus fullWidth type="password" label="New password" helperText={error || 'At least 6 characters'}
                  error={!!error}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }}
                />
                <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 1 }} disabled={submitting}>
                  {submitting ? 'Updating…' : 'Update password'}
                </Button>
              </Box>
            )}

            <Button fullWidth size="small" onClick={goHome} sx={{ mt: 2 }}>
              ← Back to store
            </Button>
          </Paper>
        </Container>
      </Box>
      <Footer onSelectCategory={goHome} />
    </Box>
  );
}
