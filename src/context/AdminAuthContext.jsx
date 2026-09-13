import React, { createContext, useContext, useState, useCallback } from 'react';
import paymentConfig from '../config/payment.js';

const AdminAuthContext = createContext(null);
const TOKEN_KEY = 'priyasafashion_admin_token';

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

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY));
  const [error, setError] = useState('');
  const [mfaChallengeToken, setMfaChallengeToken] = useState(null);
  const backendConfigured = !!paymentConfig.backendBaseUrl;

  const login = useCallback(async (identifier, password) => {
    setError('');
    if (!backendConfigured) { setError('No backend configured.'); return false; }
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { identifier, password } });
      if (data.mfaRequired) {
        setMfaChallengeToken(data.challengeToken);
        return 'mfa';
      }
      if (data.user.role !== 'admin') {
        setError('This account is not an admin account.');
        return false;
      }
      window.localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
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
      if (data.user.role !== 'admin') {
        setError('This account is not an admin account.');
        return false;
      }
      window.localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setMfaChallengeToken(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [mfaChallengeToken]);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const value = {
    token, isAdmin: !!token, backendConfigured,
    mfaChallengePending: !!mfaChallengeToken,
    login, submitMfaCode, logout,
    error, clearError: () => setError(''),
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
