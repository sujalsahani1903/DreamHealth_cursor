import OrderStatusBadge from "./OrderStatusBadge";

function fmt(n) {
  return `₹${Number(n || 0).toFixed(2)}`;
}

function unitPrice(item) {
  return Number(item.unit_price ?? item.price ?? 0);
}

function lineTotal(item) {
  if (item.line_total != null) return Number(item.line_total);
  return unitPrice(item) * Number(item.quantity || 1);
}

export default function OrderLineItems({ items, showStatus = true, renderItemActions }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-500">No products in this order.</p>;
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/80">
          <tr>
            <th className="px-3 py-2 font-semibold">Product</th>
            <th className="px-3 py-2 font-semibold">Qty</th>
            <th className="px-3 py-2 font-semibold">Price × Qty</th>
            <th className="px-3 py-2 font-semibold">Total</th>
            {showStatus && <th className="px-3 py-2 font-semibold">Status</th>}
            {renderItemActions && <th className="px-3 py-2 font-semibold">Manage</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => {
            const unit = unitPrice(item);
            const qty = Number(item.quantity || 1);
            const total = lineTotal(item);
            return (
              <tr key={item.id ?? `${item.product_id}-${item.name}`}>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 dark:bg-slate-800">
                        —
                      </div>
                    )}
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                  </div>
                </td>
                <td className="px-3 py-3 align-middle">
                  <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800">
                    {qty}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                  {fmt(unit)} × {qty}
                </td>
                <td className="px-3 py-3 font-bold text-brand-green dark:text-emerald-200">{fmt(total)}</td>
                {showStatus && (
                  <td className="px-3 py-3">
                    <OrderStatusBadge status={item.item_status || "pending"} />
                  </td>
                )}
                {renderItemActions && <td className="px-3 py-3">{renderItemActions(item)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
