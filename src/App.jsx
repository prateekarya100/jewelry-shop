import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Slide from '@mui/material/Slide';
import { StoreProvider, useStore } from './context/StoreContext.jsx';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import { CustomerAuthProvider } from './context/CustomerAuthContext.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import TrustStrip from './components/TrustStrip.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import ProductModal from './components/ProductModal.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Checkout from './components/Checkout.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AccountPage from './components/AccountPage.jsx';
import Footer from './components/Footer.jsx';
import TermsPage from './components/TermsPage.jsx';
import PrivacyPolicyPage from './components/PrivacyPolicyPage.jsx';
import ShippingPolicyPage from './components/ShippingPolicyPage.jsx';
import RefundPolicyPage from './components/RefundPolicyPage.jsx';
import ContactPage from './components/ContactPage.jsx';

function slideUp(props) { return <Slide {...props} direction="up" />; }

function ToastHost() {
  const { toast } = useStore();
  return (
    <Snackbar
      open={!!toast}
      autoHideDuration={2600}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      TransitionComponent={slideUp}
    >
      <Alert severity="success" variant="filled" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 600 }} icon={false}>
        {toast}
      </Alert>
    </Snackbar>
  );
}

function Shop({ onEnterAdmin, onOpenAccount }) {
  const { products, categories, addToCart, cartDetailed } = useStore();
  const [activeProduct, setActiveProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  function handleAddToCart(productId, qty) {
    addToCart(productId, qty);
    setActiveProduct(null);
    setCartOpen(true);
  }

  function handleCheckout() {
    if (cartDetailed.length === 0) return;
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  function handleSelectCategory(cat) {
    setActiveCategory(cat);
    // Wait a tick so any drawer-close/layout shift finishes first, then scroll.
    requestAnimationFrame(() => {
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <Box>
      <Header
        categories={categories}
        onOpenCart={() => setCartOpen(true)}
        onOpenAdmin={onEnterAdmin}
        onSelectCategory={handleSelectCategory}
        onOpenAccount={onOpenAccount}
      />
      <Box component="main">
        <Hero />
        <TrustStrip />
        <ProductGrid
          products={products}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onOpen={setActiveProduct}
        />
      </Box>
      <Footer onSelectCategory={handleSelectCategory} />

      {activeProduct && (
        <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} onAddToCart={handleAddToCart} />
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={handleCheckout} />

      {checkoutOpen && <Checkout onClose={() => setCheckoutOpen(false)} />}

      <ToastHost />
    </Box>
  );
}

function Root() {
  const { categories } = useStore();
  const [view, setView] = useState('shop'); // 'shop' | 'admin' | 'account'

  if (view === 'admin') {
    return (
      <>
        <AdminDashboard onExit={() => setView('shop')} />
        <ToastHost />
      </>
    );
  }

  if (view === 'account') {
    return (
      <>
        <AccountPage
          categories={categories}
          onExit={() => setView('shop')}
          onOpenCart={() => setView('shop')}
          onOpenAdmin={() => setView('admin')}
          onSelectCategory={() => setView('shop')}
        />
        <ToastHost />
      </>
    );
  }

  return <Shop onEnterAdmin={() => setView('admin')} onOpenAccount={() => setView('account')} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AdminAuthProvider>
          <CustomerAuthProvider>
            <Routes>
              <Route path="/" element={<Root />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
              <Route path="/refund-policy" element={<RefundPolicyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="*" element={<Root />} />
            </Routes>
          </CustomerAuthProvider>
        </AdminAuthProvider>
      </StoreProvider>
    </BrowserRouter>
  );
}
