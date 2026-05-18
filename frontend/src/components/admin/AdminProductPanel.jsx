import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";

const PACK_PRESETS = [
  { label: "250g", weight_grams: 250 },
  { label: "500g", weight_grams: 500 },
  { label: "1kg", weight_grams: 1000 },
  { label: "2kg", weight_grams: 2000 },
  { label: "5kg", weight_grams: 5000 },
];

const emptyVariant = (label, weight_grams, sort_order, is_default = false) => ({
  id: null,
  label,
  weight_grams,
  selling_price: "",
  cost_price: "",
  stock: "",
  is_default,
  sort_order,
});

const emptyForm = () => ({
  category_id: "",
  name: "",
  description: "",
  price: "",
  stock: "",
  cost_price: "",
  selling_price: "",
  image: "",
  featured: false,
});

function mediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_URL || "";
  return `${base}${path}`;
}

export default function AdminProductPanel({ onCatalogChange }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [useNewCategory, setUseNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [variants, setVariants] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        api.get("/api/categories"),
        api.get("/api/products", { params: { per_page: 200 } }),
      ]);
      setCategories(Array.isArray(c.data) ? c.data : []);
      setProducts(Array.isArray(p.data?.items) ? p.data.items : []);
    } catch {
      toast.error("Could not load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setUseNewCategory(false);
    setNewCategoryName("");
    setVariants([]);
    setModalOpen(true);
  };

  const addPackPreset = (preset) => {
    if (variants.some((v) => v.label === preset.label)) {
      toast.error(`${preset.label} already added`);
      return;
    }
    setVariants((prev) => [
      ...prev,
      emptyVariant(preset.label, preset.weight_grams, prev.length + 1, prev.length === 0),
    ]);
  };

  const updateVariant = (index, field, value) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "is_default" && value) {
        return next.map((v, i) => ({ ...v, is_default: i === index }));
      }
      return next;
    });
  };

  const removeVariant = (index) => {
    setVariants((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length && !next.some((v) => v.is_default)) next[0].is_default = true;
      return next;
    });
  };

  const openEdit = async (id) => {
    try {
      const { data } = await api.get(`/api/products/${id}`);
      setEditingId(id);
      setForm({
        category_id: String(data.category_id),
        name: data.name || "",
        description: data.description || "",
        price: String(data.price ?? data.selling_price ?? ""),
        stock: String(data.stock ?? ""),
        cost_price: String(data.cost_price ?? ""),
        selling_price: String(data.selling_price ?? ""),
        image: data.image || "",
        featured: Boolean(data.featured),
      });
      setUseNewCategory(false);
      setNewCategoryName("");
      setVariants(
        (data.variants || []).map((v) => ({
          id: v.id,
          label: v.label,
          weight_grams: v.weight_grams,
          selling_price: String(v.selling_price),
          cost_price: String(v.cost_price ?? ""),
          stock: String(v.stock),
          is_default: Boolean(v.is_default),
          sort_order: v.sort_order,
        }))
      );
      setModalOpen(true);
    } catch {
      toast.error("Could not load product");
    }
  };

  const resolveCategoryId = async () => {
    if (useNewCategory) {
      const name = newCategoryName.trim();
      if (!name) {
        toast.error("Enter a category name");
        return null;
      }
      try {
        const { data } = await api.post("/api/categories", { name });
        setCategories((prev) => {
          if (prev.some((c) => c.id === data.id)) return prev;
          return [...prev, data].sort((a, b) => a.name.localeCompare(b.name));
        });
        setForm((f) => ({ ...f, category_id: String(data.id) }));
        setUseNewCategory(false);
        setNewCategoryName("");
        return data.id;
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not create category");
        return null;
      }
    }
    if (!form.category_id) {
      toast.error("Select or create a category");
      return null;
    }
    return Number(form.category_id);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    setSaving(true);
    const categoryId = await resolveCategoryId();
    if (!categoryId) {
      setSaving(false);
      return;
    }
    const builtVariants = variants
      .filter((v) => v.label?.trim() && Number(v.selling_price) > 0)
      .map((v, i) => ({
        id: v.id || undefined,
        label: v.label.trim(),
        weight_grams: v.weight_grams || null,
        selling_price: Number(v.selling_price),
        cost_price: Number(v.cost_price || form.cost_price || 0),
        stock: Number(v.stock || 0),
        is_default: Boolean(v.is_default),
        sort_order: i + 1,
      }));

    const defaultVariant = builtVariants.find((v) => v.is_default) || builtVariants[0];

    const payload = {
      category_id: categoryId,
      name: form.name.trim(),
      description: (form.description || "").trim() || "—",
      price: Number(form.price || defaultVariant?.selling_price || form.selling_price || 0),
      stock: builtVariants.length
        ? builtVariants.reduce((s, v) => s + v.stock, 0)
        : Number(form.stock || 0),
      cost_price: Number(defaultVariant?.cost_price || form.cost_price || 0),
      selling_price: Number(defaultVariant?.selling_price || form.selling_price || 0),
      image: form.image.trim() || null,
      featured: Boolean(form.featured),
      variants: builtVariants,
    };

    if (payload.selling_price <= 0) {
      toast.error("Add at least one pack size with a selling price, or set a base selling price");
      setSaving(false);
      return;
    }
    try {
      if (editingId) {
        await api.put(`/api/products/${editingId}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/api/products", payload);
        toast.success("Product created");
      }
      setModalOpen(false);
      await load();
      onCatalogChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/api/products/${id}`);
      toast.success("Product removed");
      setDeleteId(null);
      await load();
      onCatalogChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "products");
    try {
      const { data } = await api.post("/api/admin/upload", fd);
      const url = data.url || "";
      setForm((f) => ({ ...f, image: url }));
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    }
    e.target.value = "";
  };

  if (loading) {
    return <div className="mt-8 text-center text-sm text-slate-500">Loading catalog…</div>;
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Add, edit, or remove products. Changes are saved to the database and appear everywhere after refresh.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold dark:border-slate-600"
          >
            Refresh list
          </button>
          <button type="button" onClick={openAdd} className="rounded-full bg-brand-green px-4 py-2 text-xs font-bold text-white">
            + Add product
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900/80">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Product</th>
              <th className="px-3 py-2 text-right font-semibold">Price</th>
              <th className="px-3 py-2 text-right font-semibold">Stock</th>
              <th className="px-3 py-2 text-center font-semibold">Featured</th>
              <th className="px-3 py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {p.image ? (
                      <img src={mediaUrl(p.image)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
                    )}
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                      <div className="text-xs text-slate-500">#{p.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">₹{Number(p.selling_price).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{p.stock}</td>
                <td className="px-3 py-2 text-center">{p.featured ? "★" : "—"}</td>
                <td className="px-3 py-2 text-right">
                  <button type="button" className="mr-2 text-xs font-bold text-brand-green" onClick={() => openEdit(p.id)}>
                    Edit
                  </button>
                  <button type="button" className="text-xs font-bold text-red-600" onClick={() => setDeleteId(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="font-display text-xl font-bold text-brand-green dark:text-emerald-100">
              {editingId ? "Edit product" : "New product"}
            </h3>
            <form onSubmit={save} className="mt-4 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Category</span>
                  <button
                    type="button"
                    className="text-xs font-bold text-brand-green hover:underline"
                    onClick={() => {
                      setUseNewCategory((v) => !v);
                      setNewCategoryName("");
                    }}
                  >
                    {useNewCategory ? "Use existing category" : "+ New category"}
                  </button>
                </div>
                {useNewCategory ? (
                  <input
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                    placeholder="e.g. Millets, Atta, Sattu"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                ) : (
                  <select
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-brand-green dark:text-emerald-200">Pack sizes (250g – 5kg)</span>
                  <div className="flex flex-wrap gap-1">
                    {PACK_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => addPackPreset(preset)}
                        className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-bold hover:bg-slate-50 dark:border-slate-600"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                {variants.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Add pack sizes above, or leave empty to create a single 1 kg pack from base price/stock below.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {variants.map((v, i) => (
                      <div
                        key={`${v.label}-${i}`}
                        className="grid gap-2 rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800/50 sm:grid-cols-6"
                      >
                        <div className="font-bold sm:col-span-1">{v.label}</div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Sell ₹"
                          className="rounded-lg border px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
                          value={v.selling_price}
                          onChange={(e) => updateVariant(i, "selling_price", e.target.value)}
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Cost ₹"
                          className="rounded-lg border px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
                          value={v.cost_price}
                          onChange={(e) => updateVariant(i, "cost_price", e.target.value)}
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Stock"
                          className="rounded-lg border px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
                          value={v.stock}
                          onChange={(e) => updateVariant(i, "stock", e.target.value)}
                        />
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="default_pack"
                            checked={v.is_default}
                            onChange={() => updateVariant(i, "is_default", true)}
                          />
                          Default
                        </label>
                        <button type="button" className="text-red-600 font-bold" onClick={() => removeVariant(i)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="block text-xs font-semibold">
                Name
                <input
                  required
                  className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="block text-xs font-semibold">
                Description
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-semibold">
                  Cost (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                  />
                </label>
                <label className="block text-xs font-semibold">
                  Selling (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                    value={form.selling_price}
                    onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-semibold">
                  List price (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="Same as selling if empty"
                  />
                </label>
                <label className="block text-xs font-semibold">
                  Stock (units)
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-xs font-semibold">
                Image URL
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://… or upload below"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                Featured on homepage
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Upload image file
                <input type="file" accept="image/*" className="mt-1 w-full text-sm" onChange={uploadImage} />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-full border px-4 py-2 text-sm font-bold"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-brand-gold px-4 py-2 text-sm font-bold text-brand-green disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <p className="text-sm text-slate-700 dark:text-slate-200">Delete this product permanently?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-full border px-4 py-2 text-sm font-bold" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button type="button" className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white" onClick={() => remove(deleteId)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
