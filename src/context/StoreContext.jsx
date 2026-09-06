import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import seedProducts from '../data/seedProducts.js';
import { loadJSON, saveJSON, uid, generateOrderId } from '../utils/storage.js';
import paymentConfig from '../config/payment.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(() => loadJSON('products', seedProducts));
  const [productsSource, setProductsSource] = useState('local'); // 'local' | 'backend'
  const [cart, setCart] = useState(() => loadJSON('cart', [])); // [{productId, qty}]
  const [reviews, setReviews] = useState(() => loadJSON('reviews', {})); // {productId: [{id,name,rating,comment,date}]}
  const [orders, setOrders] = useState(() => loadJSON('orders', []));
  const [toast, setToast] = useState(null);

  // Load the shared catalogue from the backend when one is configured, so
  // every visitor (and the Admin Dashboard) sees the same products instead
  // of each browser's own local copy. Falls back to the local/seed catalogue
  // if no backend is configured or it can't be reached.
  const refreshProducts = useCallback(async () => {
    if (!paymentConfig.backendBaseUrl) return;
    try {
      const res = await fetch(`${paymentConfig.backendBaseUrl}/api/products`);
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      setProducts(data);
      setProductsSource('backend');
    } catch (err) {
      console.warn('Could not load products from backend, using local copy:', err);
      setProductsSource('local');
    }
  }, []);

  useEffect(() => { refreshProducts(); }, [refreshProducts]);

  useEffect(() => { if (productsSource === 'local') saveJSON('products', products); }, [products, productsSource]);
  useEffect(() => saveJSON('cart', cart), [cart]);
  useEffect(() => saveJSON('reviews', reviews), [reviews]);
  useEffect(() => saveJSON('orders', orders), [orders]);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), 2600);
  }, []);

  // ---------- Products ----------
  // Product create/update/delete now go through the backend (see
  // AdminDashboard.jsx), which is the shared source of truth. After any
  // change there, call refreshProducts() (above) to reload the canonical
  // list — there's nothing product-related to do here in StoreContext.

  // ---------- Cart ----------
  const addToCart = useCallback((productId, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { productId, qty }];
    });
    notify('Added to bag');
  }, [notify]);

  const updateCartQty = useCallback((productId, qty) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, qty } : i));
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartDetailed = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        const unitPrice = Math.round(product.price * (1 - (product.discount || 0) / 100));
        return { ...item, product, unitPrice, lineTotal: unitPrice * item.qty };
      })
      .filter(Boolean);
  }, [cart, products]);

  const cartSubtotal = useMemo(
    () => cartDetailed.reduce((sum, i) => sum + i.lineTotal, 0),
    [cartDetailed]
  );
  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);

  // ---------- Reviews ----------
  const addReview = useCallback((productId, review) => {
    setReviews((prev) => {
      const list = prev[productId] || [];
      return {
        ...prev,
        [productId]: [
          { id: uid('rev'), date: new Date().toISOString(), ...review },
          ...list,
        ],
      };
    });
    notify('Thanks for your review');
  }, [notify]);

  const getReviews = useCallback((productId) => reviews[productId] || [], [reviews]);

  const getRatingSummary = useCallback((productId) => {
    const list = reviews[productId] || [];
    if (list.length === 0) return { avg: 0, count: 0 };
    const avg = list.reduce((sum, r) => sum + r.rating, 0) / list.length;
    return { avg, count: list.length };
  }, [reviews]);

  // ---------- Orders ----------
  const placeOrder = useCallback((customer, paymentMethod, paymentRef) => {
    const order = {
      id: generateOrderId(),
      items: cartDetailed.map((i) => ({
        productId: i.productId,
        title: i.product.title,
        qty: i.qty,
        unitPrice: i.unitPrice,
      })),
      total: cartSubtotal,
      customer,
      paymentMethod,
      paymentRef: paymentRef || null,
      status: paymentMethod === 'cod' ? 'confirmed-cod' : 'paid',
      // Every order starts as "Confirmed" the moment checkout completes —
      // whether that's a successful payment or choosing cash on delivery.
      // The admin moves it forward from there (Out for delivery, Delivered).
      fulfillmentStatus: 'confirmed',
      date: new Date().toISOString(),
    };
    setOrders((prev) => [order, ...prev]);
    clearCart();

    // Best-effort sync to the shared backend, so this order is visible in
    // the Admin Dashboard and in the customer's own account from ANY
    // device — not just this browser's local history. If a customer is
    // logged in, attach their session token so the order links to their
    // account. Silently ignored if no backend is configured or it can't
    // be reached — the local copy above always succeeds regardless, so
    // checkout itself never depends on this.
    if (paymentConfig.backendBaseUrl) {
      const customerToken = window.localStorage.getItem('priyasafashion_customer_token');
      fetch(`${paymentConfig.backendBaseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
        },
        body: JSON.stringify(order),
      }).catch((err) => console.warn('Order sync to backend failed (order still saved locally):', err));
    }

    return order;
  }, [cartDetailed, cartSubtotal, clearCart]);

  const updateOrderStatus = useCallback((orderId, fulfillmentStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, fulfillmentStatus } : o)));
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))],
    [products]
  );

  const value = {
    products, categories, refreshProducts, productsSource,
    cart, cartDetailed, cartSubtotal, cartCount, addToCart, updateCartQty, removeFromCart, clearCart,
    reviews, addReview, getReviews, getRatingSummary,
    orders, placeOrder, updateOrderStatus,
    toast, notify,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
