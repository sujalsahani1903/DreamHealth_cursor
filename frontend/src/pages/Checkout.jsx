import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Checkout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/api/auth/addresses")
      .then((r) => {
        setAddresses(r.data);
        if (r.data[0]) setAddressId(String(r.data[0].id));
      })
      .catch(() => {});
  }, [user]);

  const pay = async () => {
    if (!addressId) {
      toast.error("Add an address in your account first");
      return navigate("/dashboard/addresses");
    }
    setBusy(true);
    try {
      const o = await api.post("/api/orders", { address_id: Number(addressId) });
      const payRes = await api.post("/api/payment/create-checkout-session", { order_id: o.data.order_id });
      window.location.href = payRes.data.url;
    } catch (e) {
      toast.error(e.response?.data?.message || "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Helmet>
        <title>Checkout — Dream Health Foods</title>
      </Helmet>
      <h1 className="font-display text-3xl font-bold text-brand-green dark:text-emerald-100">Checkout</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Secure payment powered by Stripe.</p>
      <div className="mt-6 space-y-3">
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
      <button
        type="button"
        disabled={busy}
        onClick={pay}
        className="mt-6 w-full rounded-full bg-brand-green py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "Redirecting…" : "Pay with Stripe"}
      </button>
    </div>
  );
}
