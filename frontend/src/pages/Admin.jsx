import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import { api } from "../services/api";
import AdminInventoryPanel from "../components/admin/AdminInventoryPanel";
import AdminOrdersPanel from "../components/admin/AdminOrdersPanel";
import AdminProductPanel from "../components/admin/AdminProductPanel";

export default function Admin() {
  const [tab, setTab] = useState("overview");
  const [dash, setDash] = useState(null);
  const [top, setTop] = useState([]);
  const [perf, setPerf] = useState([]);
  const [orders, setOrders] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, t, p, o, f] = await Promise.all([
        api.get("/api/admin/dashboard"),
        api.get("/api/admin/top-selling-products"),
        api.get("/api/admin/product-performance"),
        api.get("/api/admin/orders"),
        api.get("/api/admin/customer-feedbacks"),
      ]);
      setDash(d.data);
      setTop(Array.isArray(t.data) ? t.data : []);
      setPerf(Array.isArray(p.data) ? p.data : []);
      setOrders(Array.isArray(o.data) ? o.data : []);
      setFeedbacks(Array.isArray(f.data) ? f.data : []);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "products", label: "Products" },
    { id: "inventory", label: "Inventory" },
    { id: "orders", label: "Orders" },
    { id: "feedbacks", label: "Feedbacks" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Helmet>
        <title>Admin — Dream Health Foods</title>
      </Helmet>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-green dark:text-emerald-100">Admin</h1>
          <p className="text-sm text-slate-500">Manage catalog, stock, and orders</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/" className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">
            ← Storefront
          </Link>
          <Link to="/shop" className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">
            View shop
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={() => load()}
            className="rounded-full bg-brand-green px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh data"}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              tab === t.id ? "bg-brand-green text-white shadow-md" : "border border-slate-200 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && dash && (
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass rounded-2xl p-4">
              <div className="text-xs text-slate-500">Users</div>
              <div className="text-2xl font-bold">{dash.total_users}</div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="text-xs text-slate-500">Revenue (paid orders)</div>
              <div className="text-2xl font-bold">₹{Number(dash.total_revenue || 0).toFixed(2)}</div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="text-xs text-slate-500">Est. profit</div>
              <div className="text-2xl font-bold">₹{Number(dash.estimated_profit || 0).toFixed(2)}</div>
            </div>
            <div className="glass rounded-2xl p-4 md:col-span-3">
              <div className="text-sm font-bold text-brand-green dark:text-emerald-100">Top selling (units)</div>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top.length ? top : [{ name: "—", units_sold: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="units_sold" fill="#1B4D3E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {perf.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-brand-green dark:text-emerald-100">Product performance snapshot</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {perf.slice(0, 9).map((row) => (
                  <div key={row.product_id} className="glass rounded-xl p-3 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</div>
                    <div className="mt-1 text-slate-600 dark:text-slate-400">
                      Sold {row.units_sold} · Revenue ₹{Number(row.revenue || 0).toFixed(2)} · Stock {row.current_stock}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "products" && <AdminProductPanel onCatalogChange={load} />}

      {tab === "inventory" && <AdminInventoryPanel onStockChange={load} />}

      {tab === "orders" && <AdminOrdersPanel />}

      {tab === "feedbacks" && (
        <div className="mt-8 space-y-3">
          {feedbacks.map((f) => (
            <div key={f.id} className="glass rounded-2xl p-4 text-sm">
              <div className="font-semibold">
                {f.product?.name} · ★{f.rating} · {f.user?.name}
              </div>
              <p className="mt-2 text-slate-700 dark:text-slate-200">{f.feedback}</p>
              {f.admin_reply && <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">Admin: {f.admin_reply}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
