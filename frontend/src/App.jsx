import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import MainLayout from "./layouts/MainLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { RequireAuth, RequireAdmin } from "./routes/PrivateRoute";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("./pages/CheckoutCancel"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Verify = lazy(() => import("./pages/Verify"));
const Forgot = lazy(() => import("./pages/Forgot"));
const Reset = lazy(() => import("./pages/Reset"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));

function SuspenseFallback() {
  return <div className="p-16 text-center text-sm text-slate-500">Loading…</div>;
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<SuspenseFallback />}>
                <Routes>
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route path="shop" element={<Shop />} />
                    <Route path="products/:id" element={<ProductDetail />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="checkout/success" element={<CheckoutSuccess />} />
                    <Route path="checkout/cancel" element={<CheckoutCancel />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="verify" element={<Verify />} />
                    <Route path="forgot" element={<Forgot />} />
                    <Route path="reset" element={<Reset />} />
                  </Route>

                  <Route element={<RequireAuth />}>
                    <Route path="dashboard/*" element={<Dashboard />} />
                  </Route>

                  <Route element={<RequireAdmin />}>
                    <Route path="/admin" element={<Admin />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
            <Toaster position="top-center" />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
