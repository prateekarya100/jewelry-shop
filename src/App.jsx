import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Slide from "@mui/material/Slide";
import { StoreProvider, useStore } from "./context/StoreContext.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { CustomerAuthProvider } from "./context/CustomerAuthContext.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import TrustStrip from "./components/TrustStrip.jsx";
import ProductGrid from "./components/ProductGrid.jsx";
import ProductModal from "./components/ProductModal.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import AccountPage from "./components/AccountPage.jsx";
import Footer from "./components/Footer.jsx";
import TermsPage from "./components/TermsPage.jsx";
import PrivacyPolicyPage from "./components/PrivacyPolicyPage.jsx";
import ShippingPolicyPage from "./components/ShippingPolicyPage.jsx";
import RefundPolicyPage from "./components/RefundPolicyPage.jsx";
import ContactPage from "./components/ContactPage.jsx";
import ForgotPasswordPage from "./components/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./components/ResetPasswordPage.jsx";
import CheckoutPage from "./components/Checkout.jsx";

function slideUp(props) {
  return <Slide {...props} direction="up" />;
}

function ToastHost() {
  const { toast } = useStore();
  return (
    <Snackbar
      open={!!toast}
      autoHideDuration={2600}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      TransitionComponent={slideUp}
    >
      <Alert
        severity="success"
        variant="filled"
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          fontWeight: 600,
        }}
        icon={false}
      >
        {toast}
      </Alert>
    </Snackbar>
  );
}

function Shop() {
  const { products, categories, addToCart, cartDetailed } = useStore();
  const navigate = useNavigate();
  const [activeProduct, setActiveProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  function handleAddToCart(productId, qty) {
    addToCart(productId, qty);
    setActiveProduct(null);
    setCartOpen(true);
  }

  function handleCheckout() {
    if (cartDetailed.length === 0) return;
    setCartOpen(false);
    navigate("/checkout");
  }

  function handleSelectCategory(cat) {
    setActiveCategory(cat);
    requestAnimationFrame(() => {
      document
        .getElementById("shop")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <Box>
      <Header
        categories={categories}
        onOpenCart={() => setCartOpen(true)}
        onSelectCategory={handleSelectCategory}
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
        <ProductModal
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />

      <ToastHost />
    </Box>
  );
}

function AdminRoute() {
  const navigate = useNavigate();
  return (
    <>
      <AdminDashboard onExit={() => navigate("/")} />
      <ToastHost />
    </>
  );
}

function AccountRoute() {
  const navigate = useNavigate();
  const { categories } = useStore();
  return (
    <>
      <AccountPage
        categories={categories}
        onExit={() => navigate("/")}
        onOpenCart={() => navigate("/")}
        onSelectCategory={() => navigate("/")}
        onCheckout={() => navigate("/checkout")}
      />
      <ToastHost />
    </>
  );
}

function CheckoutRoute() {
  const { categories } = useStore();
  function handleSelectCategory() {}
  return (
    <>
      <CheckoutPage
        categories={categories}
        onSelectCategory={handleSelectCategory}
      />
      <ToastHost />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AdminAuthProvider>
          <CustomerAuthProvider>
            <Routes>
              <Route path="/" element={<Shop />} />
              <Route path="/admin" element={<AdminRoute />} />
              <Route path="/account" element={<AccountRoute />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
              <Route path="/refund-policy" element={<RefundPolicyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/checkout" element={<CheckoutRoute />} />
              <Route path="*" element={<Shop />} />
            </Routes>
          </CustomerAuthProvider>
        </AdminAuthProvider>
      </StoreProvider>
    </BrowserRouter>
  );
}
