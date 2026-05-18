import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function lineTotal(row) {
  return row.line_total ?? row.quantity * (row.unit_price ?? row.product?.selling_price ?? 0);
}

export default function Checkout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [cartRows, setCartRows] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { state: { from: "/checkout" } });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.get("/api/auth/addresses"), api.get("/api/cart"), api.get("/api/payment/methods")])
      .then(([addrRes, cartRes, methodsRes]) => {
        setAddresses(addrRes.data);
        if (addrRes.data[0]) setAddressId(String(addrRes.data[0].id));
        setCartRows(cartRes.data);
        if (!cartRes.data?.length) navigate("/cart");
        const methods = Array.isArray(methodsRes.data) ? methodsRes.data : [];
        setPaymentMethods(methods);
        if (methods[0]) setPaymentMethod(methods[0].id);
      })
      .catch(() => {});
  }, [user, navigate]);

  const subtotal = cartRows.reduce((s, r) => s + lineTotal(r), 0);

  const placeOrder = async () => {
    if (!addressId) {
      toast.error("Add an address in your account first");
      return navigate("/dashboard/addresses");
    }
    if (!cartRows.length) {
      toast.error("Your cart is empty");
      return navigate("/cart");
    }
    if (!paymentMethod) {
      toast.error("Select a payment method");
      return;
    }

    setBusy(true);
    try {
      const o = await api.post("/api/orders", { address_id: Number(addressId) });

      if (paymentMethod === "cod") {
        await api.post("/api/payment/cod", { order_id: o.data.order_id });
        toast.success("Order placed — pay on delivery");
        navigate(`/checkout/success?order_id=${o.data.order_id}&method=cod`);
        return;
      }

      const payRes = await api.post("/api/payment/create-checkout-session", { order_id: o.data.order_id });
      window.location.href = payRes.data.url;
    } catch (e) {
      toast.error(e.response?.data?.message || "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Helmet>
        <title>Checkout — Dream Health Foods</title>
      </Helmet>
      <h1 className="font-display text-3xl font-bold text-brand-green dark:text-emerald-100">Checkout</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Review your order and choose how you want to pay.</p>

      <div className="mt-6 space-y-3">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Order summary</h2>
        {cartRows.map((r) => (
          <div key={r.id} className="glass flex gap-3 rounded-2xl p-3 text-sm">
            <img src={r.product?.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <div className="flex-1">
              <div className="font-semibold">{r.product?.name}</div>
              {r.variant?.label && <div className="text-xs text-brand-gold">{r.variant.label}</div>}
              <div className="mt-1 text-slate-600 dark:text-slate-400">
                ₹{Number(r.unit_price ?? r.product?.selling_price).toFixed(2)} × {r.quantity} ={" "}
                <span className="font-bold">₹{lineTotal(r).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-between rounded-xl bg-brand-green/10 px-4 py-3 text-sm font-bold dark:bg-emerald-900/30">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <Link to="/cart" className="text-xs font-semibold text-brand-green hover:underline">
          Edit cart
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        <label className="text-sm font-semibold">Shipping address</label>
        <select
          value={addressId}
          onChange={(e) => setAddressId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Select</option>
          {addresses.map((a) => (
            <option key={a.id} value={a.id}>
              {a.address_line}, {a.city}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Payment method</h2>
        <div className="space-y-2">
          {paymentMethods.map((m) => (
            <label
              key={m.id}
              className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                paymentMethod === m.id
                  ? "border-brand-green bg-brand-green/5 ring-1 ring-brand-green"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-600"
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value={m.id}
                checked={paymentMethod === m.id}
                onChange={() => setPaymentMethod(m.id)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{m.label}</div>
                <p className="text-xs text-slate-500">{m.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={busy || !cartRows.length || !paymentMethods.length}
        onClick={placeOrder}
        className="mt-6 w-full rounded-xl bg-brand-gold py-3.5 text-sm font-bold uppercase tracking-wide text-brand-green shadow-md disabled:opacity-50"
      >
        {busy
          ? "Processing…"
          : paymentMethod === "cod"
            ? `Place order · Pay ₹${subtotal.toFixed(2)} on delivery`
            : `Pay online · ₹${subtotal.toFixed(2)}`}
      </button>
    </div>
  );
}
