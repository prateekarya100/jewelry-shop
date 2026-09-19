import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Alert from "@mui/material/Alert";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";

const EMPTY_LOGIN = { identifier: "", password: "" };
const EMPTY_REGISTER = { name: "", email: "", phone: "", password: "" };

export default function AccountDialog({ open, onClose }) {
  const {
    login,
    submitMfaCode,
    mfaChallengePending,
    startRegister,
    verifyRegisterOtp,
    resendRegistrationOtp,
    cancelPendingRegistration,
    pendingRegistrationEmail,
    requestPasswordReset,
    error,
    clearError,
  } = useCustomerAuth();

  const [tab, setTab] = useState(0);
  const [view, setView] = useState("main"); // 'main' | 'forgot'
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER);
  const [mfaCode, setMfaCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotState, setForgotState] = useState(null); // null | 'sent' | 'error'

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function handleClose() {
    clearError();
    setLoginForm(EMPTY_LOGIN);
    setRegisterForm(EMPTY_REGISTER);
    setMfaCode("");
    setOtpCode("");
    setView("main");
    setForgotEmail("");
    setForgotState(null);
    cancelPendingRegistration();
    onClose();
  }

  async function submitLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(loginForm.identifier, loginForm.password);
    setSubmitting(false);
    if (result === "ok") handleClose();
  }

  async function submitMfa(e) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await submitMfaCode(mfaCode);
    setSubmitting(false);
    if (ok) handleClose();
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
    const ok = await verifyRegisterOtp(otpCode);
    setSubmitting(false);
    if (ok) handleClose();
  }

  async function handleResend() {
    setSubmitting(true);
    const ok = await resendRegistrationOtp();
    setSubmitting(false);
    if (ok) setResendCooldown(30);
  }

  async function submitForgot(e) {
    e.preventDefault();
    setSubmitting(true);
    setForgotState(null);
    try {
      await requestPasswordReset(forgotEmail);
      setForgotState("sent");
    } catch {
      setForgotState("error");
    } finally {
      setSubmitting(false);
    }
  }

  // --- MFA step ---
  if (mfaChallengePending) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Playfair Display', serif" }}>
          Two-factor verification
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the 6-digit code from your authenticator app.
          </Typography>
          <Box component="form" onSubmit={submitMfa}>
            <TextField
              autoFocus
              fullWidth
              size="small"
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
              sx={{ mt: 1 }}
              disabled={submitting}
            >
              {submitting ? "Verifying…" : "Verify"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // --- OTP verification step ---
  if (pendingRegistrationEmail) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Playfair Display', serif" }}>
          Verify your email
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We sent a 6-digit code to{" "}
            <strong>{pendingRegistrationEmail}</strong>. It expires in 10
            minutes.
          </Typography>
          <Box component="form" onSubmit={submitVerifyOtp}>
            <TextField
              autoFocus
              fullWidth
              size="small"
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
              sx={{ mt: 1 }}
              disabled={submitting || otpCode.length !== 6}
            >
              {submitting ? "Verifying…" : "Verify & create account"}
            </Button>
          </Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
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
                ? `Resend (${resendCooldown}s)`
                : "Resend code"}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Forgot password step ---
  if (view === "forgot") {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Playfair Display', serif" }}>
          Reset your password
        </DialogTitle>
        <DialogContent>
          {forgotState === "sent" ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                If an account exists for that email, a reset link has been sent.
                Check your inbox (and spam folder).
              </Alert>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setView("main");
                  setForgotState(null);
                  setForgotEmail("");
                }}
              >
                Back to sign in
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={submitForgot}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter the email address on your account and we'll send you a
                link to reset your password.
              </Typography>
              <TextField
                autoFocus
                fullWidth
                size="small"
                label="Email address"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                sx={{ mb: 1.5 }}
              />
              {forgotState === "error" && (
                <Alert severity="error" sx={{ mb: 1.5 }}>
                  Something went wrong. Please try again.
                </Alert>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting || !forgotEmail}
              >
                {submitting ? "Sending…" : "Send reset link"}
              </Button>
              <Button
                fullWidth
                size="small"
                sx={{ mt: 1 }}
                onClick={() => {
                  setView("main");
                  setForgotState(null);
                }}
              >
                Back to sign in
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // --- Main login/register ---
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontFamily: "'Playfair Display', serif" }}>
        Your account
      </DialogTitle>
      <DialogContent>
        <Tabs
          value={tab}
          onChange={(_e, v) => {
            setTab(v);
            clearError();
          }}
          sx={{ mb: 2 }}
        >
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
                autoFocus
                fullWidth
                size="small"
                label="Email or phone"
                value={loginForm.identifier}
                onChange={(e) =>
                  setLoginForm((f) => ({ ...f, identifier: e.target.value }))
                }
              />
              <TextField
                fullWidth
                size="small"
                type="password"
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
              sx={{ mt: 1 }}
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Button
                size="small"
                variant="text"
                color="inherit"
                sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                onClick={() => {
                  clearError();
                  setView("forgot");
                }}
              >
                Forgot your password?
              </Button>
            </Box>
          </Box>
        ) : (
          <Box component="form" onSubmit={submitStartRegister}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create an account to track orders across any device.
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                autoFocus
                fullWidth
                size="small"
                label="Full name"
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              <TextField
                fullWidth
                size="small"
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
                size="small"
                label="Phone"
                value={registerForm.phone}
                onChange={(e) =>
                  setRegisterForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
              <TextField
                fullWidth
                size="small"
                type="password"
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
              sx={{ mt: 1.5 }}
              disabled={submitting}
            >
              {submitting ? "Sending code…" : "Register"}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
