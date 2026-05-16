import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";

export default function AdminInventoryPanel({ onStockChange }) {
  const [rows, setRows] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addQty, setAddQty] = useState({});
  const [stockInputs, setStockInputs] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, al, lg] = await Promise.all([
        api.get("/api/inventory"),
        api.get("/api/inventory/alerts"),
        api.get("/api/inventory/logs"),
      ]);
      setRows(Array.isArray(inv.data) ? inv.data : []);
      setAlerts(Array.isArray(al.data) ? al.data : []);
      setLogs(Array.isArray(lg.data) ? lg.data : []);
    } catch {
      toast.error("Could not load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const doAddStock = async (productId) => {
    const q = parseInt(addQty[productId] || "0", 10);
    if (q <= 0) {
      toast.error("Enter a positive quantity to add");
      return;
    }
    try {
      await api.post("/api/inventory/add-stock", { product_id: productId, quantity: q });
      toast.success("Stock added");
      setAddQty((m) => ({ ...m, [productId]: "" }));
      await load();
      onStockChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const doSetStock = async (productId) => {
    const v = stockInputs[productId];
    if (v === undefined || v === "") {
      toast.error("Enter new stock level");
      return;
    }
    const n = parseInt(String(v), 10);
    if (Number.isNaN(n) || n < 0) {
      toast.error("Invalid stock number");
      return;
    }
    try {
      await api.put("/api/inventory/update-stock", { product_id: productId, new_stock: n });
      toast.success("Stock updated");
      setStockInputs((m) => ({ ...m, [productId]: "" }));
      await load();
      onStockChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  if (loading) {
    return <div className="mt-8 text-center text-sm text-slate-500">Loading inventory…</div>;
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Adjust stock levels, add units, and review alerts. All changes persist in the database.
        </p>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold dark:border-slate-600"
        >
          Refresh
        </button>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/40">
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">Low stock alerts</h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-900/90 dark:text-amber-100/90">
            {alerts.map((a) => (
              <li key={a.id}>
                <strong>{a.product_name}</strong> — current {a.current_stock}, threshold {a.threshold_value}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900/80">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Product</th>
              <th className="px-3 py-2 text-right font-semibold">Cost</th>
              <th className="px-3 py-2 text-right font-semibold">Sell</th>
              <th className="px-3 py-2 text-right font-semibold">Margin %</th>
              <th className="px-3 py-2 text-right font-semibold">Stock</th>
              <th className="px-3 py-2 text-left font-semibold">Add qty</th>
              <th className="px-3 py-2 text-left font-semibold">Set stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                <td className="px-3 py-2 font-medium">{p.name}</td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">
                  {p.cost_price != null ? `₹${Number(p.cost_price).toFixed(2)}` : "—"}
                </td>
                <td className="px-3 py-2 text-right">₹{Number(p.selling_price).toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">
                  {p.profit_margin != null ? `${Number(p.profit_margin).toFixed(1)}%` : "—"}
                </td>
                <td className="px-3 py-2 text-right font-bold">{p.stock}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="1"
                      placeholder="+"
                      className="w-16 rounded-lg border px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                      value={addQty[p.id] ?? ""}
                      onChange={(e) => setAddQty((m) => ({ ...m, [p.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="rounded-lg bg-brand-green px-2 py-1 text-xs font-bold text-white"
                      onClick={() => doAddStock(p.id)}
                    >
                      Add
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0"
                      placeholder="="
                      className="w-16 rounded-lg border px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                      value={stockInputs[p.id] ?? ""}
                      onChange={(e) => setStockInputs((m) => ({ ...m, [p.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="rounded-lg border border-brand-gold px-2 py-1 text-xs font-bold text-brand-brown dark:text-brand-gold"
                      onClick={() => doSetStock(p.id)}
                    >
                      Set
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-sm font-bold text-brand-green dark:text-emerald-100">Recent inventory log</h3>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 text-xs dark:border-slate-700">
          <table className="min-w-full">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="px-2 py-1 text-left">When</th>
                <th className="px-2 py-1 text-left">Product</th>
                <th className="px-2 py-1 text-left">Action</th>
                <th className="px-2 py-1 text-right">Δ</th>
                <th className="px-2 py-1 text-right">Before</th>
                <th className="px-2 py-1 text-right">After</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 50).map((r) => (
                <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-1 whitespace-nowrap text-slate-500">{r.created_at?.replace("T", " ").slice(0, 19)}</td>
                  <td className="px-2 py-1">{r.product_name}</td>
                  <td className="px-2 py-1">{r.action_type}</td>
                  <td className="px-2 py-1 text-right">{r.quantity}</td>
                  <td className="px-2 py-1 text-right">{r.previous_stock}</td>
                  <td className="px-2 py-1 text-right">{r.new_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
