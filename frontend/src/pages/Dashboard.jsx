import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import OrderLineItems from "../components/orders/OrderLineItems";
import OrderStatusBadge from "../components/orders/OrderStatusBadge";
import { paymentMethodLabel, paymentStatusLabel } from "../utils/paymentLabels";

export default function Dashboard() {
  const { pathname } = useLocation();

  const parts = pathname.split("/").filter(Boolean);

  const tab = parts[1] || "profile";

  const navigate = useNavigate();

  const { user, setUser, logout } = useAuth();

  const { theme, toggle } = useTheme();

  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const [addresses, setAddresses] = useState([]);

  const [addrForm, setAddrForm] = useState({
    address_line: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState("all");

  const [wish, setWish] = useState([]);

  useEffect(() => {
    setProfile({
      name: user?.name || "",
      phone: user?.phone || "",
    });
  }, [user]);

  useEffect(() => {
    if (tab === "addresses") {
      api.get("/api/auth/addresses").then((r) => setAddresses(r.data));
    }

    if (tab === "orders") {
      api.get("/api/orders/my-orders").then((r) => setOrders(r.data));
    }

    if (tab === "wishlist") {
      api.get("/api/wishlist").then((r) => setWish(r.data));
    }
  }, [tab]);

  const saveProfile = async (e) => {
    e.preventDefault();

    try {
      const { data } = await api.put("/api/auth/profile", profile);

      setUser(data);

      localStorage.setItem("user", JSON.stringify(data));

      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const addAddr = async (e) => {
    e.preventDefault();

    try {
      await api.post("/api/auth/addresses", addrForm);

      toast.success("Address added");

      setAddrForm({
        address_line: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      });

      const r = await api.get("/api/auth/addresses");

      setAddresses(r.data);
    } catch {
      toast.error("Failed to add address");
    }
  };

  const invoice = async (id) => {
    try {
      const { data } = await api.get(`/api/orders/${id}/invoice`);

      const w = window.open("", "_blank");

      w.document.write(`<pre>${JSON.stringify(data, null, 2)}</pre>`);
    } catch {
      toast.error("Failed to load invoice");
    }
  };

  const nav = [
    {
      to: "/dashboard",
      label: "Profile",
      key: "profile",
    },
    {
      to: "/dashboard/addresses",
      label: "Addresses",
      key: "addresses",
    },
    {
      to: "/dashboard/orders",
      label: "Orders",
      key: "orders",
    },
    {
      to: "/dashboard/wishlist",
      label: "Wishlist",
      key: "wishlist",
    },
    {
      to: "/dashboard/settings",
      label: "Settings",
      key: "settings",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard — Dream Health Foods</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">

            {/* LEFT */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-brand-green dark:text-emerald-200">
                Dream Health
              </h1>
            </div>

            {/* CENTER */}
            <nav className="hidden items-center gap-6 md:flex">

              <button
                onClick={() => navigate("/")}
                className="text-sm font-semibold text-slate-700 transition hover:text-brand-green dark:text-slate-200"
              >
                Home
              </button>

              <button
                onClick={() => navigate("/shop")}
                className="text-sm font-semibold text-slate-700 transition hover:text-brand-green dark:text-slate-200"
              >
                Shop
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                className="text-sm font-semibold text-slate-700 transition hover:text-brand-green dark:text-slate-200"
              >
                Dashboard
              </button>

              <button
                onClick={() => navigate("/contact")}
                className="text-sm font-semibold text-slate-700 transition hover:text-brand-green dark:text-slate-200"
              >
                Contact
              </button>
            </nav>

            {/* RIGHT */}
            <div className="flex items-center gap-3">

              <button
                onClick={toggle}
                className="rounded-xl bg-brand-gold px-4 py-2 text-sm font-bold text-brand-green"
              >
                {theme === "dark" ? "Light" : "Dark"}
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white">
                {user?.name?.charAt(0)}
              </div>

            </div>
          </div>
        </header>

        {/* MAIN SECTION */}
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">

          {/* SIDEBAR */}
          <aside className="sticky top-24 hidden h-fit w-64 shrink-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:block dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-6">
              <h2 className="text-xl font-bold text-brand-green dark:text-emerald-200">
                {user?.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {user?.email}
              </p>
            </div>

            <nav className="space-y-2">
              {nav.map((n) => (
                <button
                  key={n.key}
                  onClick={() => navigate(n.to)}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                    tab === n.key
                      ? "bg-brand-green text-white shadow-md"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </nav>

            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="mt-8 w-full rounded-2xl border border-red-300 py-3 text-sm font-bold text-red-600"
            >
              Logout
            </button>
          </aside>

          {/* CONTENT */}
          <main className="flex-1 space-y-6">

            {/* PROFILE */}
            {tab === "profile" && (
              <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">

                <h1 className="text-3xl font-bold text-brand-green dark:text-emerald-200">
                  My Profile
                </h1>

                <form
                  onSubmit={saveProfile}
                  className="mt-6 space-y-4"
                >

<div className="mb-4 flex flex-col gap-2">
  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
    Username
  </label>
  <input
    className="w-full rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
    placeholder="Full name"
    value={profile.name}
    onChange={(e) =>
      setProfile({
        ...profile,
        name: e.target.value,
      })
    }
  />
</div>

<div className="mb-4 flex flex-col gap-2">
  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
    Phone Number
  </label>
  <input
    className="w-full rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
    placeholder="Phone"
    value={profile.phone}
    onChange={(e) =>
      setProfile({
        ...profile,
        phone: e.target.value,
      })
    }
  />
</div>

                  <button
                    type="submit"
                    className="rounded-2xl bg-brand-green px-6 py-3 font-bold text-white"
                  >
                    Save Changes
                  </button>

                </form>
              </div>
            )}

            {/* ADDRESSES */}
            {tab === "addresses" && (
              <div className="space-y-6">

                <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">

                  <h2 className="text-2xl font-bold text-brand-green dark:text-emerald-200">
                    Saved Addresses
                  </h2>

                  <div className="mt-4 space-y-3">
                    {addresses.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                      >
                        {a.address_line}, {a.city}, {a.state}, {a.pincode}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">

                  <h2 className="text-2xl font-bold text-brand-green dark:text-emerald-200">
                    Add Address
                  </h2>

                  <form
                    onSubmit={addAddr}
                    className="mt-4 grid gap-3 md:grid-cols-2"
                  >

                    <input
                      className="md:col-span-2 rounded-2xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                      placeholder="Address line"
                      value={addrForm.address_line}
                      onChange={(e) =>
                        setAddrForm({
                          ...addrForm,
                          address_line: e.target.value,
                        })
                      }
                    />

                    <input
                      className="rounded-2xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                      placeholder="City"
                      value={addrForm.city}
                      onChange={(e) =>
                        setAddrForm({
                          ...addrForm,
                          city: e.target.value,
                        })
                      }
                    />

                    <input
                      className="rounded-2xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                      placeholder="State"
                      value={addrForm.state}
                      onChange={(e) =>
                        setAddrForm({
                          ...addrForm,
                          state: e.target.value,
                        })
                      }
                    />

                    <input
                      className="rounded-2xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                      placeholder="Pincode"
                      value={addrForm.pincode}
                      onChange={(e) =>
                        setAddrForm({
                          ...addrForm,
                          pincode: e.target.value,
                        })
                      }
                    />

                    <input
                      className="rounded-2xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                      placeholder="Country"
                      value={addrForm.country}
                      onChange={(e) =>
                        setAddrForm({
                          ...addrForm,
                          country: e.target.value,
                        })
                      }
                    />

                    <button
                      type="submit"
                      className="md:col-span-2 rounded-2xl bg-brand-gold py-3 font-bold text-brand-green"
                    >
                      Save Address
                    </button>

                  </form>
                </div>
              </div>
            )}

            {/* ORDERS */}
            {tab === "orders" && (
              <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">

                <h2 className="text-2xl font-bold text-brand-green dark:text-emerald-200">My Orders</h2>
                <p className="mt-1 text-sm text-slate-500">Each product has its own delivery status.</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "active", label: "In progress" },
                    { id: "delivered", label: "Delivered" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setOrderFilter(f.id)}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                        orderFilter === f.id
                          ? "bg-brand-green text-white"
                          : "border border-slate-200 dark:border-slate-600"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-4">

                  {orders
                    .filter((o) => {
                      if (orderFilter === "all") return true;
                      const items = o.items || [];
                      const allDelivered =
                        items.length > 0 && items.every((i) => (i.item_status || "pending") === "delivered");
                      if (orderFilter === "delivered") return allDelivered || o.order_status === "delivered";
                      return !allDelivered && o.order_status !== "delivered" && o.order_status !== "cancelled";
                    })
                    .map((o) => (
                    <div
                      key={o.id}
                      className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                    >

                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-bold">Order #{o.id}</div>
                          <p className="text-xs text-slate-500">
                            {o.created_at ? new Date(o.created_at).toLocaleString("en-IN") : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">₹{Number(o.total_amount).toFixed(2)}</div>
                          <div className="mt-1 flex flex-wrap justify-end gap-1">
                            <OrderStatusBadge status={o.order_status} />
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold dark:bg-slate-800">
                              {paymentMethodLabel(o.payment_method)}
                            </span>
                            <OrderStatusBadge
                              status={o.payment_status}
                              label={paymentStatusLabel(o.payment_status, o.payment_method)}
                            />
                          </div>
                        </div>
                      </div>

                      {o.shipping_address && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold">Ship to:</span> {o.shipping_address}
                        </p>
                      )}
                      <OrderLineItems items={o.items} />

                      <button
                        type="button"
                        onClick={() => invoice(o.id)}
                        className="mt-3 text-sm font-bold text-brand-green hover:underline"
                      >
                        View invoice
                      </button>

                    </div>
                  ))}
                  {!orders.length && (
                    <p className="text-sm text-slate-500">You have not placed any orders yet.</p>
                  )}

                </div>
              </div>
            )}

            {/* WISHLIST */}
            {tab === "wishlist" && (
              <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">

                <h2 className="text-2xl font-bold text-brand-green dark:text-emerald-200">
                  Wishlist
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  {wish.map((w) => (
                    <div
                      key={w.id}
                      className="flex gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                    >

                      <img
                        src={w.product.image}
                        alt=""
                        className="h-20 w-20 rounded-xl object-cover"
                      />

                      <div>
                        <h3 className="font-semibold">
                          {w.product.name}
                        </h3>

                        <button
                          onClick={async () => {
                            await api.delete(`/api/wishlist/remove/${w.id}`);

                            const r = await api.get("/api/wishlist");

                            setWish(r.data);
                          }}
                          className="mt-2 text-sm font-bold text-red-600"
                        >
                          Remove
                        </button>
                      </div>

                    </div>
                  ))}

                </div>
              </div>
            )}

            {/* SETTINGS */}
            {tab === "settings" && (
              <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">

                <h2 className="text-2xl font-bold text-brand-green dark:text-emerald-200">
                  Settings
                </h2>

                <p className="mt-3 text-sm text-slate-500">
                  Current theme: {theme}
                </p>

                <button
                  onClick={toggle}
                  className="mt-4 rounded-2xl bg-brand-green px-6 py-3 font-bold text-white"
                >
                  Toggle Theme
                </button>

              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
}