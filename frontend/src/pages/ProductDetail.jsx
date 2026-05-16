import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SkeletonCard, SkeletonText } from "../components/Skeletons";

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

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/api/products/${id}`), api.get(`/api/reviews/product/${id}`)])
      .then(([pr, rv]) => {
        setP(pr.data);
        setReviews(rv.data);
      })
      .catch(() => toast.error("Could not load product"))
      .finally(() => setLoading(false));
  }, [id]);

  const addCart = async () => {
    if (!user) return navigate("/login");
    try {
      await api.post("/api/cart/add", { product_id: Number(id), quantity: qty });
      toast.success("Added to cart");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
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
          <div className="mt-6 text-3xl font-bold text-brand-green">₹{p.selling_price}</div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-24 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
            <button type="button" onClick={addCart} className="rounded-full bg-brand-green px-6 py-3 text-sm font-bold text-white">
              Add to cart
            </button>
            <button type="button" onClick={addWish} className="rounded-full border border-brand-gold px-6 py-3 text-sm font-bold">
              Wishlist
            </button>
          </div>
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
