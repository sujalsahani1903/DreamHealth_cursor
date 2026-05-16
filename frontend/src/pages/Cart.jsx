import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function CartPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);

  const load = () => api.get("/api/cart").then((r) => setRows(r.data));

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    else if (user) load().catch(() => {});
  }, [user, loading, navigate]);

  const updateQty = async (id, quantity) => {
    try {
      await api.put(`/api/cart/update/${id}`, { quantity });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    }
  };

  const remove = async (id) => {
    await api.delete(`/api/cart/remove/${id}`);
    load();
  };

  const subtotal = rows.reduce((s, r) => s + r.quantity * r.product.selling_price, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Helmet>
        <title>Cart — Dream Health Foods</title>
      </Helmet>
      <h1 className="font-display text-3xl font-bold text-brand-green dark:text-emerald-100">Your cart</h1>
      <div className="mt-6 space-y-4">
        {rows.length === 0 && <p className="text-slate-600">Your cart is empty.</p>}
        {rows.map((r) => (
          <div key={r.id} className="glass flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <img src={r.product.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
              <div>
                <Link to={`/products/${r.product.id}`} className="font-semibold">
                  {r.product.name}
                </Link>
                <div className="text-sm text-slate-500">₹{r.product.selling_price}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={r.quantity}
                onChange={(e) => updateQty(r.id, Number(e.target.value))}
                className="w-20 rounded-xl border px-2 py-1 text-sm dark:bg-slate-900"
              />
              <button type="button" onClick={() => remove(r.id)} className="text-sm text-red-600">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between rounded-2xl bg-brand-green px-6 py-4 text-white">
        <div className="text-sm">Subtotal</div>
        <div className="text-xl font-bold">₹{subtotal.toFixed(2)}</div>
      </div>
      <button
        type="button"
        disabled={rows.length === 0}
        onClick={() => navigate("/checkout")}
        className="mt-4 w-full rounded-full bg-brand-gold py-3 text-sm font-bold text-brand-green disabled:opacity-40"
      >
        Proceed to checkout
      </button>
    </div>
  );
}
