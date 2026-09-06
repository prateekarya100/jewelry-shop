import React, { createContext, useContext, useState, useCallback } from 'react';
import paymentConfig from '../config/payment.js';

const CustomerAuthContext = createContext(null);
const TOKEN_KEY = 'priyasafashion_customer_token';
const CUSTOMER_KEY = 'priyasafashion_customer_info';

export function CustomerAuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY));
  const [customer, setCustomer] = useState(() => {
    try {
      const raw = window.localStorage.getItem(CUSTOMER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState('');
  const backendConfigured = !!paymentConfig.backendBaseUrl;

  function persist(newToken, newCustomer) {
    window.localStorage.setItem(TOKEN_KEY, newToken);
    window.localStorage.setItem(CUSTOMER_KEY, JSON.stringify(newCustomer));
    setToken(newToken);
    setCustomer(newCustomer);
  }

  const register = useCallback(async ({ name, email, phone, password }) => {
    setError('');
    if (!backendConfigured) {
      setError('No backend configured — see src/config/payment.js (backendBaseUrl).');
      return false;
    }
    try {
      const res = await fetch(`${paymentConfig.backendBaseUrl}/api/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not create account');
        return false;
      }
      persist(data.token, data.customer);
      return true;
    } catch (err) {
      console.error(err);
      setError("Couldn't reach the backend. Is it running?");
      return false;
    }
  }, [backendConfigured]);

  const login = useCallback(async (identifier, password) => {
    setError('');
    if (!backendConfigured) {
      setError('No backend configured — see src/config/payment.js (backendBaseUrl).');
      return false;
    }
    try {
      const res = await fetch(`${paymentConfig.backendBaseUrl}/api/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return false;
      }
      persist(data.token, data.customer);
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
        await fetch(`${paymentConfig.backendBaseUrl}/api/customer/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // best-effort — clear locally regardless
      }
    }
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(CUSTOMER_KEY);
    setToken(null);
    setCustomer(null);
  }, [token, backendConfigured]);

  const value = {
    token,
    customer,
    isLoggedIn: !!token,
    backendConfigured,
    register,
    login,
    logout,
    error,
    clearError: () => setError(''),
  };

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
