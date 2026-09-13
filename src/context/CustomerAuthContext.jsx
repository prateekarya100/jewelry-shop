import React, { createContext, useContext, useState, useCallback } from 'react';
import paymentConfig from '../config/payment.js';

const CustomerAuthContext = createContext(null);
const TOKEN_KEY = 'priyasafashion_customer_token';
const USER_KEY = 'priyasafashion_customer_info';

async function api(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${paymentConfig.backendBaseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function CustomerAuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const raw = window.localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState('');
  // When a registration is awaiting its email OTP, we hold onto the email
  // here so the "enter code" step knows what it's verifying.
  const [pendingRegistrationEmail, setPendingRegistrationEmail] = useState(null);
  // When a login needs a 2FA code, we hold onto the short-lived challenge
  // token here until the code is submitted.
  const [mfaChallengeToken, setMfaChallengeToken] = useState(null);
  const backendConfigured = !!paymentConfig.backendBaseUrl;

  function persist(newToken, newUser) {
    window.localStorage.setItem(TOKEN_KEY, newToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setMfaChallengeToken(null);
  }

  // Step 1 of registration: send the details, get an email OTP. Returns
  // true on success (caller should then show the "enter code" step).
  const startRegister = useCallback(async ({ name, email, phone, password }) => {
    setError('');
    if (!backendConfigured) { setError('No backend configured.'); return false; }
    try {
      await api('/api/auth/register/start', { method: 'POST', body: { name, email, phone, password } });
      setPendingRegistrationEmail(email);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [backendConfigured]);

  const resendRegistrationOtp = useCallback(async () => {
    setError('');
    if (!pendingRegistrationEmail) { setError('Start registration again.'); return false; }
    try {
      await api('/api/auth/register/resend', { method: 'POST', body: { email: pendingRegistrationEmail } });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [pendingRegistrationEmail]);

  // Step 2: the code the user typed. On success, this actually creates the
  // account and logs them in.
  const verifyRegisterOtp = useCallback(async (code) => {
    setError('');
    if (!pendingRegistrationEmail) { setError('Start registration again.'); return false; }
    try {
      const data = await api('/api/auth/register/verify', { method: 'POST', body: { email: pendingRegistrationEmail, code } });
      persist(data.token, data.user);
      setPendingRegistrationEmail(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [pendingRegistrationEmail]);

  const cancelPendingRegistration = useCallback(() => {
    setPendingRegistrationEmail(null);
    setError('');
  }, []);

  // Returns 'ok' | 'mfa' | false
  const login = useCallback(async (identifier, password) => {
    setError('');
    if (!backendConfigured) { setError('No backend configured.'); return false; }
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { identifier, password } });
      if (data.mfaRequired) {
        setMfaChallengeToken(data.challengeToken);
        return 'mfa';
      }
      // Admin accounts are for managing the store, not for shopping — keep
      // the two identities separate so an admin never ends up placing
      // orders or seeing a customer-style "My Orders" view.
      if (data.user.role !== 'customer') {
        setError('This is an admin account — sign in from the Admin Dashboard instead.');
        return false;
      }
      persist(data.token, data.user);
      return 'ok';
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [backendConfigured]);

  const submitMfaCode = useCallback(async (code) => {
    setError('');
    if (!mfaChallengeToken) { setError('Session expired, please log in again.'); return false; }
    try {
      const data = await api('/api/auth/login/mfa', { method: 'POST', token: mfaChallengeToken, body: { code } });
      if (data.user.role !== 'customer') {
        setError('This is an admin account — sign in from the Admin Dashboard instead.');
        setMfaChallengeToken(null);
        return false;
      }
      persist(data.token, data.user);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [mfaChallengeToken]);

  const requestPasswordReset = useCallback(async (identifier) => {
    setError('');
    try {
      await api('/api/auth/forgot-password', { method: 'POST', body: { identifier } });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (resetToken, newPassword) => {
    setError('');
    try {
      await api('/api/auth/reset-password', { method: 'POST', body: { token: resetToken, newPassword } });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // --- 2FA management (for an already-logged-in user) ---
  const setup2fa = useCallback(async () => {
    return api('/api/auth/2fa/setup', { method: 'POST', token });
  }, [token]);

  const confirm2fa = useCallback(async (code) => {
    return api('/api/auth/2fa/confirm', { method: 'POST', token, body: { code } });
  }, [token]);

  const disable2fa = useCallback(async () => {
    await api('/api/auth/2fa/disable', { method: 'POST', token });
    setUser((u) => (u ? { ...u, mfaEnabled: false } : u));
  }, [token]);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    token, customer: user, isLoggedIn: !!token, backendConfigured,
    mfaChallengePending: !!mfaChallengeToken,
    pendingRegistrationEmail,
    startRegister, resendRegistrationOtp, verifyRegisterOtp, cancelPendingRegistration,
    login, submitMfaCode, logout,
    requestPasswordReset, resetPassword,
    setup2fa, confirm2fa, disable2fa,
    error, clearError: () => setError(''),
  };

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
