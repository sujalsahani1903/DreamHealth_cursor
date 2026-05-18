import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { SkeletonCard } from "../components/Skeletons";
import { formatProductPrice } from "../utils/productPrice";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const q = params.get("q") || "";
  const category_id = params.get("category_id") || "";
  const min_price = params.get("min_price") || "";
  const max_price = params.get("max_price") || "";
  const min_rating = params.get("min_rating") || "";
  const sort = params.get("sort") || "newest";
  const page = Number(params.get("page") || "1");

  useEffect(() => {
    api.get("/api/categories").then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const useSearch = Boolean(q || min_price || max_price || min_rating || (sort && sort !== "newest"));
    const req = useSearch
      ? api.get("/api/products/search", {
          params: {
            q: q || undefined,
            category_id: category_id || undefined,
            min_price: min_price || undefined,
            max_price: max_price || undefined,
            min_rating: min_rating || undefined,
            sort,
            page,
            per_page: 12,
          },
        })
      : api.get("/api/products", {
          params: { category_id: category_id || undefined, page, per_page: 12 },
        });
    req
      .then((r) => {
        setItems(r.data.items || []);
        setMeta({ total: r.data.total, page: r.data.page, pages: r.data.pages });
      })
      .finally(() => setLoading(false));
  }, [q, category_id, min_price, max_price, min_rating, sort, page]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === "" || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    if (!patch.page) next.set("page", "1");
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Helmet>
        <title>Shop — Dream Health Foods</title>
      </Helmet>
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="glass w-full shrink-0 rounded-2xl p-4 lg:w-64">
          <div className="text-sm font-bold text-brand-green dark:text-emerald-100">Filters</div>
          <input
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search products"
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <label className="mt-4 block text-xs font-semibold text-slate-500">Category</label>
          <select
            value={category_id}
            onChange={(e) => update({ category_id: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              placeholder="Min ₹"
              value={min_price}
              onChange={(e) => update({ min_price: e.target.value })}
              className="rounded-xl border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              placeholder="Max ₹"
              value={max_price}
              onChange={(e) => update({ max_price: e.target.value })}
              className="rounded-xl border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <label className="mt-3 block text-xs font-semibold text-slate-500">Min rating</label>
          <select
            value={min_rating}
            onChange={(e) => update({ min_rating: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Any</option>
            <option value="4">4+</option>
            <option value="3">3+</option>
          </select>
          <label className="mt-3 block text-xs font-semibold text-slate-500">Sort</label>
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="rating">Rating</option>
          </select>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-bold text-brand-green dark:text-emerald-100">Shop</h1>
            <div className="text-sm text-slate-500">{meta.total} products</div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : items.map((p) => (
                  <Link key={p.id} to={`/products/${p.id}`} className="glass overflow-hidden rounded-2xl transition hover:-translate-y-1">
                    <img src={p.image} alt="" className="h-44 w-full object-cover" />
                    <div className="p-4">
                      <div className="font-semibold">{p.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{formatProductPrice(p)}</div>
                      <div className="mt-1 text-xs text-brand-gold">★ {p.rating?.toFixed?.(1) ?? p.rating}</div>
                    </div>
                  </Link>
                ))}
          </div>
          <div className="mt-8 flex justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => update({ page: String(page - 1) })}
              className="rounded-full border px-4 py-2 text-sm disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= (meta.pages || 1)}
              onClick={() => update({ page: String(page + 1) })}
              className="rounded-full border px-4 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
