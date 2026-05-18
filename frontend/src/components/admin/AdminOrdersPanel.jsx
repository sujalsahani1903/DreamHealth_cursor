import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import OrderLineItems from "../orders/OrderLineItems";
import OrderStatusBadge from "../orders/OrderStatusBadge";
import { paymentMethodLabel, paymentStatusLabel } from "../../utils/paymentLabels";

const ITEM_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

const ORDER_TABS = [
  { id: "new", label: "New orders", statuses: ["pending"] },
  { id: "processing", label: "Processing", statuses: ["processing"] },
  { id: "shipped", label: "Shipped", statuses: ["shipped"] },
  { id: "delivered", label: "Delivered", statuses: ["delivered"] },
  { id: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function OrderCard({ order: o, open, onToggle, onUpdateItem, onSetAll, onMarkPaid }) {
  return (
    <article className="glass rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700">
      <button
        type="button"
        className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
        onClick={onToggle}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold">Order #{o.id}</span>
            <OrderStatusBadge status={o.order_status} />
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold dark:bg-slate-800">
              {paymentMethodLabel(o.payment_method)}
            </span>
            <OrderStatusBadge
              status={o.payment_status}
              label={paymentStatusLabel(o.payment_status, o.payment_method)}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">{fmtDate(o.created_at)}</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {o.user?.name} · {o.user?.email}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-brand-green dark:text-emerald-200">₹{Number(o.total_amount).toFixed(2)}</div>
          <div className="text-xs text-slate-500">{o.items?.length || 0} product(s)</div>
        </div>
      </button>

      {open && (
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Customer</h3>
              <p className="mt-2 font-semibold">{o.user?.name}</p>
              <p className="text-slate-600 dark:text-slate-300">{o.user?.email}</p>
              <p className="text-slate-600 dark:text-slate-300">{o.user?.phone || "—"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Shipping</h3>
              <p className="mt-2 text-slate-700 dark:text-slate-200">{o.shipping_address || "—"}</p>
            </div>
          </div>

          <h3 className="mt-4 text-sm font-bold text-brand-green dark:text-emerald-200">Products — manage each separately</h3>
          <OrderLineItems
            items={o.items}
            renderItemActions={(item) => (
              <select
                value={item.item_status || "pending"}
                onChange={(e) => onUpdateItem(item.id, e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
              >
                {ITEM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          />

          {o.payment_method === "cod" && o.payment_status !== "paid" && (
            <button
              type="button"
              onClick={() => onMarkPaid(o.id)}
              className="mt-4 rounded-full bg-brand-gold px-4 py-2 text-xs font-bold text-brand-green"
            >
              Mark COD payment received
            </button>
          )}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <span className="w-full text-xs font-semibold text-slate-500">Set all products:</span>
            {ITEM_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSetAll(o.id, s)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold capitalize hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default function AdminOrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [activeTab, setActiveTab] = useState("new");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { new: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    for (const o of orders) {
      const status = o.order_status || "pending";
      const tabId = status === "pending" ? "new" : status;
      if (tabId in c) c[tabId] += 1;
    }
    return c;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const tab = ORDER_TABS.find((t) => t.id === activeTab);
    if (!tab) return orders;
    return orders.filter((o) => tab.statuses.includes(o.order_status || "pending"));
  }, [orders, activeTab]);

  const updateItemStatus = async (itemId, item_status) => {
    try {
      await api.put(`/api/admin/order-items/${itemId}/status`, { item_status });
      toast.success("Product status updated");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    }
  };

  const markPaid = async (orderId) => {
    try {
      await api.put(`/api/admin/orders/${orderId}/mark-paid`);
      toast.success("Payment marked as received");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    }
  };

  const setAllItems = async (orderId, item_status) => {
    try {
      await api.put(`/api/admin/orders/${orderId}/status`, { order_status: item_status });
      toast.success("Order updated");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    }
  };

  if (loading) {
    return <p className="mt-8 text-center text-sm text-slate-500">Loading orders…</p>;
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Orders grouped by fulfillment stage. Update each product line independently.
        </p>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold dark:border-slate-600"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
        {ORDER_TABS.map((t) => {
          const count = counts[t.id] ?? 0;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                active
                  ? "bg-brand-green text-white shadow-md"
                  : "border border-slate-200 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              }`}
            >
              {t.label}
              <span
                className={`ml-2 inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 py-0.5 text-[10px] ${
                  active ? "bg-white/25" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-4">
        {filteredOrders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500 dark:border-slate-700">
            No {ORDER_TABS.find((t) => t.id === activeTab)?.label.toLowerCase() || "orders"} right now.
          </p>
        ) : (
          filteredOrders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              open={expanded[o.id]}
              onToggle={() => setExpanded((prev) => ({ ...prev, [o.id]: !prev[o.id] }))}
              onUpdateItem={updateItemStatus}
              onSetAll={setAllItems}
              onMarkPaid={markPaid}
            />
          ))
        )}
      </div>
    </div>
  );
}
