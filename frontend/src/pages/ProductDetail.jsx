import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SkeletonCard, SkeletonText } from "../components/Skeletons";
import QuantityStepper from "../components/QuantityStepper";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [busyCart, setBusyCart] = useState(false);
  const [busyBuy, setBusyBuy] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/api/products/${id}`), api.get(`/api/reviews/product/${id}`)])
      .then(([pr, rv]) => {
        setP(pr.data);
        setReviews(rv.data);
        const variants = pr.data?.variants || [];
        const def = variants.find((v) => v.is_default) || variants[0];
        setSelectedVariantId(def?.id ?? null);
      })
      .catch(() => toast.error("Could not load product"))
      .finally(() => setLoading(false));
  }, [id]);

  const activeVariant = p?.variants?.find((v) => v.id === selectedVariantId) || p?.variants?.[0];
  const unitPrice = activeVariant?.selling_price ?? p?.selling_price;
  const packStock = activeVariant?.stock ?? p?.stock ?? 0;

  const productPath = `/products/${id}`;

  const requireLogin = () => {
    if (!user) {
      navigate("/login", { state: { from: productPath } });
      return false;
    }
    return true;
  };

  const validatePack = () => {
    if (p?.has_variants && !selectedVariantId) {
      toast.error("Please select a pack size");
      return false;
    }
    if (packStock < 1) {
      toast.error("This pack size is out of stock");
      return false;
    }
    return true;
  };

  const addCart = async () => {
    if (!requireLogin() || !validatePack()) return;
    setBusyCart(true);
    try {
      await api.post("/api/cart/add", {
        product_id: Number(id),
        variant_id: selectedVariantId,
        quantity: qty,
      });
      toast.success("Added to cart");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setBusyCart(false);
    }
  };

  const buyNow = async () => {
    if (!requireLogin() || !validatePack()) return;
    setBusyBuy(true);
    try {
      await api.post("/api/cart/buy-now", {
        product_id: Number(id),
        variant_id: selectedVariantId,
        quantity: qty,
      });
      navigate("/checkout");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not proceed to checkout");
    } finally {
      setBusyBuy(false);
    }
  };

  const addWish = async () => {
    if (!user) return navigate("/login");
    try {
      await api.post(`/api/wishlist/add/${id}`);
      toast.success("Saved to wishlist");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    try {
      await api.post("/api/reviews/add", {
        product_id: Number(id),
        order_id: Number(orderId),
        rating: Number(rating),
        feedback,
      });
      toast.success("Review submitted");
      setFeedback("");
      const rv = await api.get(`/api/reviews/product/${id}`);
      setReviews(rv.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Review failed");
    }
  };

  if (loading || !p) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <SkeletonCard />
        <div className="mt-6">
          <SkeletonText lines={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Helmet>
        <title>{p.name} — Dream Health Foods</title>
      </Helmet>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="glass overflow-hidden rounded-3xl">
          <img src={p.image} alt="" className="h-96 w-full object-cover" />
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold text-brand-green dark:text-emerald-100">{p.name}</h1>
          <p className="mt-2 text-sm text-brand-gold">★ {Number(p.rating).toFixed(1)} · {p.total_reviews} reviews</p>
          <p className="mt-4 text-lg text-slate-700 dark:text-slate-200">{p.description}</p>
          <div className="mt-6 text-3xl font-bold text-brand-green">₹{Number(unitPrice).toFixed(2)}</div>

          {p.variants?.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pack size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    disabled={v.stock < 1}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      selectedVariantId === v.id
                        ? "border-brand-green bg-brand-green text-white"
                        : "border-slate-200 hover:border-brand-green dark:border-slate-600"
                    } ${v.stock < 1 ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    {v.label}
                    <span className="ml-1 text-xs opacity-80">₹{Number(v.selling_price).toFixed(0)}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {packStock > 0 ? `${packStock} in stock` : "Out of stock for this size"}
              </p>
            </div>
          )}

          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            ₹{Number(unitPrice).toFixed(2)} × {qty} ={" "}
            <span className="font-bold text-brand-green">₹{(Number(unitPrice) * qty).toFixed(2)}</span>
          </p>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</p>
            <QuantityStepper value={qty} max={packStock || 999} onChange={setQty} disabled={packStock < 1} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={packStock < 1 || busyCart || busyBuy}
              onClick={addCart}
              className="rounded-xl border-2 border-brand-green bg-white px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-brand-green transition hover:bg-brand-green/5 disabled:opacity-50 dark:bg-slate-900"
            >
              {busyCart ? "Adding…" : "Add to cart"}
            </button>
            <button
              type="button"
              disabled={packStock < 1 || busyCart || busyBuy}
              onClick={buyNow}
              className="rounded-xl bg-brand-gold px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-brand-green shadow-md transition hover:brightness-105 disabled:opacity-50"
            >
              {busyBuy ? "Please wait…" : "Buy now"}
            </button>
          </div>

          <button
            type="button"
            onClick={addWish}
            className="mt-3 text-sm font-semibold text-brand-green hover:underline dark:text-emerald-300"
          >
            Add to wishlist
          </button>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold text-brand-green dark:text-emerald-100">Reviews</h2>
        <div className="mt-4 space-y-4">
          {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-4">
              <div className="text-sm font-semibold">{r.user?.name}</div>
              <div className="text-xs text-brand-gold">★ {r.rating}</div>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{r.feedback}</p>
              {r.admin_reply && <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">Admin: {r.admin_reply}</p>}
            </div>
          ))}
        </div>

        {user && (
          <form onSubmit={submitReview} className="glass mt-8 space-y-3 rounded-2xl p-4">
            <div className="text-sm font-bold">Write a review (purchased orders only)</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Paid order ID containing this product"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-900">
              {[5, 4, 3, 2, 1].map((x) => (
                <option key={x} value={x}>
                  {x} stars
                </option>
              ))}
            </select>
            <textarea
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience"
            />
            <button type="submit" className="rounded-full bg-brand-gold px-5 py-2 text-sm font-bold text-brand-green">
              Submit review
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
