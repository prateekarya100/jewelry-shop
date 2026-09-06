import React, { createContext, useContext, useState, useCallback } from 'react';
import paymentConfig from '../config/payment.js';

const AdminAuthContext = createContext(null);
const TOKEN_KEY = 'priyasafashion_admin_token';

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY));
  const [error, setError] = useState('');
  const backendConfigured = !!paymentConfig.backendBaseUrl;

  const login = useCallback(async (username, password) => {
    setError('');
    if (!backendConfigured) {
      setError('No backend configured — see src/config/payment.js (backendBaseUrl).');
      return false;
    }
    try {
      const res = await fetch(`${paymentConfig.backendBaseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Login failed');
        return false;
      }
      const { token: newToken } = await res.json();
      window.localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      return true;
    } catch (err) {
      console.error(err);
      setError("Couldn't reach the backend. Is it running?");
      return false;
    }
  }, [backendConfigured]);

  const logout = useCallback(async () => {
    if (token && backendConfigured) {
      try {
        await fetch(`${paymentConfig.backendBaseUrl}/api/admin/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // best-effort — clear locally regardless
      }
    }
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, [token, backendConfigured]);

  const value = {
    token,
    isAdmin: !!token,
    backendConfigured,
    login,
    logout,
    error,
    clearError: () => setError(''),
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
