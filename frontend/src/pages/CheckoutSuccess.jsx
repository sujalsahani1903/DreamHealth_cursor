import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  const method = params.get("method");
  const isCod = method === "cod";
  const { user, loading, refreshSession } = useAuth();

  useEffect(() => {
    if (localStorage.getItem("access_token") || localStorage.getItem("refresh_token")) {
      refreshSession();
    }
  }, [refreshSession]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <Helmet>
        <title>{isCod ? "Order placed" : "Payment successful"}</title>
      </Helmet>
      <div className="text-5xl text-brand-green">✓</div>
      <h1 className="mt-4 font-display text-3xl font-bold text-brand-green dark:text-emerald-100">
        {isCod ? "Order placed!" : "Payment successful"}
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        {isCod
          ? "Thank you! Please keep cash ready — you will pay when your order is delivered."
          : "Thank you for choosing Dream Health Foods."}
      </p>
      {orderId && <p className="mt-2 text-sm font-semibold text-brand-gold">Order #{orderId}</p>}
      {isCod && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
          Payment method: <strong>Cash on Delivery (COD)</strong>
        </p>
      )}
      {!loading && user && (
        <p className="mt-2 text-sm text-slate-500">You are still signed in as {user.name}.</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/dashboard/orders"
          className="rounded-full bg-brand-green px-6 py-3 text-sm font-bold text-white"
        >
          View my orders
        </Link>
        <Link
          to="/shop"
          className="rounded-full border border-brand-gold px-6 py-3 text-sm font-bold text-brand-brown dark:text-brand-gold"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
