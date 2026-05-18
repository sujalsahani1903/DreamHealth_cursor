const STYLES = {
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  processing: "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200",
  shipped: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-200",
  delivered: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  cancelled: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200",
  paid: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  failed: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200",
  refunded: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function OrderStatusBadge({ status, label }) {
  const key = (status || "pending").toLowerCase();
  const text = label || status?.replace(/_/g, " ") || "pending";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STYLES[key] || STYLES.pending}`}>
      {text}
    </span>
  );
}
