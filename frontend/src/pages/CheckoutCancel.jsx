import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";

export default function CheckoutCancel() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <Helmet>
        <title>Payment cancelled</title>
      </Helmet>
      <h1 className="font-display text-3xl font-bold text-brand-brown">Payment cancelled</h1>
      <p className="mt-2 text-slate-600">No charge was made{orderId ? ` for order #${orderId}` : ""}.</p>
      <Link to="/cart" className="mt-6 inline-block rounded-full bg-brand-green px-6 py-3 text-sm font-bold text-white">
        Return to cart
      </Link>
    </div>
  );
}
