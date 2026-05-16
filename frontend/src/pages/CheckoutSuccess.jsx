import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <Helmet>
        <title>Payment successful</title>
      </Helmet>
      <div className="text-5xl">✓</div>
      <h1 className="mt-4 font-display text-3xl font-bold text-brand-green">Payment successful</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Thank you for choosing Dream Health Foods.</p>
      {orderId && <p className="mt-2 text-sm">Order #{orderId}</p>}
    </div>
  );
}
