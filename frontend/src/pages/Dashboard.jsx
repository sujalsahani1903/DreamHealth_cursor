import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Dashboard() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  const tab = parts[1] || "profile";

  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const [profile, setProfile] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState({ address_line: "", city: "", state: "", pincode: "", country: "India" });
  const [orders, setOrders] = useState([]);
  const [wish, setWish] = useState([]);

  useEffect(() => {
    setProfile({ name: user?.name || "", phone: user?.phone || "" });
  }, [user]);

  useEffect(() => {
    if (tab === "addresses") api.get("/api/auth/addresses").then((r) => setAddresses(r.data));
    if (tab === "orders") api.get("/api/orders/my-orders").then((r) => setOrders(r.data));
    if (tab === "wishlist") api.get("/api/wishlist").then((r) => setWish(r.data));
  }, [tab]);

  const saveProfile = async (e) => {
    e.preventDefault();
    const { data } = await api.put("/api/auth/profile", profile);
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
    toast.success("Saved");
  };

  const addAddr = async (e) => {
    e.preventDefault();
    await api.post("/api/auth/addresses", addrForm);
    toast.success("Address added");
    setAddrForm({ address_line: "", city: "", state: "", pincode: "", country: "India" });
    const r = await api.get("/api/auth/addresses");
    setAddresses(r.data);
  };

  const invoice = async (id) => {
    const { data } = await api.get(`/api/orders/${id}/invoice`);
    const w = window.open("", "_blank");
    w.document.write(`<pre>${JSON.stringify(data, null, 2)}</pre>`);
  };

  const nav = [
    { to: "/dashboard", label: "Profile", key: "profile" },
    { to: "/dashboard/addresses", label: "Addresses", key: "addresses" },
    { to: "/dashboard/orders", label: "Orders", key: "orders" },
    { to: "/dashboard/wishlist", label: "Wishlist", key: "wishlist" },
    { to: "/dashboard/settings", label: "Settings", key: "settings" },
  ];

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-10">
      <Helmet>
        <title>My account — Dream Health Foods</title>
      </Helmet>
      <aside className="glass hidden w-56 shrink-0 rounded-2xl p-4 md:block">
        <div className="text-sm font-bold text-brand-green">{user?.name}</div>
        <nav className="mt-4 space-y-1">
          {nav.map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => navigate(n.to)}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${
                tab === n.key
                  ? "bg-brand-green text-white"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="mt-6 w-full rounded-full border border-slate-200 py-2 text-xs font-bold dark:border-slate-700"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Logout
        </button>
      </aside>

      <div className="flex-1 space-y-6">
        {(tab === "profile") && (
          <div className="glass rounded-2xl p-6">
            <h1 className="font-display text-2xl font-bold text-brand-green dark:text-emerald-100">Profile</h1>
            <form onSubmit={saveProfile} className="mt-4 space-y-3">
              <input className="w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              <input className="w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              <button className="rounded-full bg-brand-green px-5 py-2 text-sm font-bold text-white" type="submit">
                Save
              </button>
            </form>
          </div>
        )}

        {tab === "addresses" && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-brand-green dark:text-emerald-100">Saved addresses</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {addresses.map((a) => (
                  <li key={a.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    {a.address_line}, {a.city}, {a.state} {a.pincode}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-brand-green dark:text-emerald-100">Add address</h2>
              <form onSubmit={addAddr} className="mt-3 grid gap-2 md:grid-cols-2">
                <input
                  className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
                  placeholder="Address line"
                  value={addrForm.address_line}
                  onChange={(e) => setAddrForm({ ...addrForm, address_line: e.target.value })}
                  required
                />
                <input className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" placeholder="City" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} required />
                <input className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" placeholder="State" value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} required />
                <input className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" placeholder="Pincode" value={addrForm.pincode} onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })} required />
                <input className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" placeholder="Country" value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} required />
                <button className="md:col-span-2 rounded-full bg-brand-gold py-2 text-sm font-bold text-brand-green" type="submit">
                  Save address
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold text-brand-green dark:text-emerald-100">Orders</h2>
            <div className="mt-4 space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold">#{o.id}</div>
                    <div className="text-xs text-slate-500">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 text-xs">
                    {o.order_status} · {o.payment_status}
                  </div>
                  <div className="mt-2 font-bold">₹{o.total_amount}</div>
                  <button type="button" className="mt-2 text-xs font-bold text-brand-green" onClick={() => invoice(o.id)}>
                    View invoice
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "wishlist" && (
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold text-brand-green dark:text-emerald-100">Wishlist</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {wish.map((w) => (
                <div key={w.id} className="flex gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <img src={w.product.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <div className="text-sm">
                    <div className="font-semibold">{w.product.name}</div>
                    <button
                      type="button"
                      className="mt-2 text-xs text-red-600"
                      onClick={async () => {
                        await api.delete(`/api/wishlist/remove/${w.id}`);
                        const r = await api.get("/api/wishlist");
                        setWish(r.data);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold text-brand-green dark:text-emerald-100">Settings</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Theme: {theme}</p>
            <button type="button" className="mt-4 rounded-full bg-brand-green px-5 py-2 text-sm font-bold text-white" onClick={toggle}>
              Toggle dark / light
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
