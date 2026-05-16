import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { SkeletonCard } from "../components/Skeletons";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/products", { params: { featured: 1, per_page: 8 } })
      .then((r) => setFeatured(r.data.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>Dream Health Foods — Premium Healthy Grains</title>
      </Helmet>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-cream via-white to-emerald-50 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-gold/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-brand-green/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-green shadow-sm dark:bg-slate-900/70">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> 100% natural · Premium milling
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-brand-green md:text-5xl dark:text-emerald-100">
              Blended with Purity, Served with Trust.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-300">
              Whole wheat atta, multigrain blends, millets, sattu and customised mixes — crafted with care in Siliguri.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="rounded-full bg-brand-green px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20"
              >
                Shop grains
              </Link>
              <Link
                to="/about"
                className="rounded-full border border-brand-gold bg-white/70 px-6 py-3 text-sm font-bold text-brand-brown dark:bg-slate-900/70"
              >
                Our story
              </Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.6 }} className="glass relative rounded-3xl p-6">
            <div className="grid grid-cols-2 gap-4">
              {["Atta", "Millet", "Sattu", "Health Mixes"].map((t) => (
                <div key={t} className="rounded-2xl bg-white/80 p-4 text-center text-sm font-semibold text-brand-green shadow-sm dark:bg-slate-900/80 dark:text-emerald-100">
                  {t}
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">Trusted nutrition for Indian kitchens.</p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-brand-green dark:text-emerald-100">Featured picks</h2>
            <p className="text-slate-600 dark:text-slate-300">Customer favourites with glowing reviews.</p>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-brand-gold">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : featured.map((p) => (
                <motion.div key={p.id} whileHover={{ y: -4 }} className="glass overflow-hidden rounded-2xl">
                  <Link to={`/products/${p.id}`}>
                    <img src={p.image} alt="" className="h-40 w-full object-cover" />
                    <div className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                      <div className="mt-1 text-sm text-slate-500">₹{p.selling_price}</div>
                    </div>
                  </Link>
                </motion.div>
              ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="glass rounded-3xl p-8 md:p-12">
          <h3 className="font-display text-2xl font-bold text-brand-green dark:text-emerald-100">FAQ</h3>
          <div className="mt-6 space-y-4 text-sm text-slate-700 dark:text-slate-200">
            <details className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <summary className="cursor-pointer font-semibold">Do you customise atta mixes?</summary>
              <p className="mt-2 text-slate-600 dark:text-slate-300">Yes — share your goals and we blend grains accordingly.</p>
            </details>
            <details className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <summary className="cursor-pointer font-semibold">How fresh is the milling?</summary>
              <p className="mt-2 text-slate-600 dark:text-slate-300">We maintain tight inventory rotation for peak freshness.</p>
            </details>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="rounded-3xl bg-brand-green px-6 py-10 text-center text-emerald-50 md:px-12">
          <h3 className="font-display text-2xl font-bold text-brand-gold">Join our wellness letters</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-emerald-100">Seasonal recipes, harvest notes and offers — no spam.</p>
          <form
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thanks — connect Resend/Mail to enable newsletter sends.");
            }}
          >
            <input className="flex-1 rounded-full px-4 py-2 text-slate-900" placeholder="Your email" type="email" required />
            <button type="submit" className="rounded-full bg-brand-gold px-5 py-2 text-sm font-bold text-brand-green">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
