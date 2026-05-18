import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import QuantityStepper from "../components/QuantityStepper";

function lineUnit(row) {
  return Number(row.unit_price ?? row.product?.selling_price ?? 0);
}

function lineTotal(row) {
  if (row.line_total != null) return Number(row.line_total);
  return lineUnit(row) * row.quantity;
}

export default function CartPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  const load = () => api.get("/api/cart").then((r) => setRows(r.data));

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    else if (user) load().catch(() => {});
  }, [user, loading, navigate]);

  const updateQty = async (id, quantity) => {
    if (quantity < 1) return;
    setUpdatingId(id);
    try {
      await api.put(`/api/cart/update/${id}`, { quantity });
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/api/cart/remove/${id}`);
      await load();
    } catch (e) {
      toast.error("Could not remove item");
    }
  };

  const subtotal = rows.reduce((s, r) => s + lineTotal(r), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Helmet>
        <title>Cart — Dream Health Foods</title>
      </Helmet>
      <h1 className="font-display text-3xl font-bold text-brand-green dark:text-emerald-100">Your cart</h1>
      <div className="mt-6 space-y-4">
        {rows.length === 0 && <p className="text-slate-600 dark:text-slate-400">Your cart is empty.</p>}
        {rows.map((r) => {
          const unit = lineUnit(r);
          const total = lineTotal(r);
          return (
            <div
              key={r.id}
              className="glass flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex gap-4">
                <img src={r.product.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <div>
                  <Link to={`/products/${r.product.id}`} className="font-semibold text-slate-900 dark:text-slate-100">
                    {r.product.name}
                    {r.variant?.label && (
                      <span className="ml-1 font-normal text-brand-gold">({r.variant.label})</span>
                    )}
                  </Link>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    ₹{unit.toFixed(2)} × {r.quantity} ={" "}
                    <span className="font-bold text-brand-green dark:text-emerald-200">₹{total.toFixed(2)}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                <QuantityStepper
                  value={r.quantity}
                  disabled={updatingId === r.id}
                  onChange={(q) => updateQty(r.id, q)}
                />
                <div className="text-right sm:hidden">
                  <div className="text-lg font-bold text-brand-green">₹{total.toFixed(2)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="text-sm font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
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
