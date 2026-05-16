import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role: "user",
  });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/auth/signup", form);
      toast.success("Account created — verify OTP");
      navigate(`/verify?email=${encodeURIComponent(form.email)}&purpose=signup`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Helmet>
        <title>Sign up — Dream Health Foods</title>
      </Helmet>
      <div className="glass rounded-3xl p-8">
        <h1 className="font-display text-3xl font-bold text-brand-green dark:text-emerald-100">Create account</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input className="w-full rounded-xl border px-3 py-2 dark:bg-slate-900" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          <input className="w-full rounded-xl border px-3 py-2 dark:bg-slate-900" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="w-full rounded-xl border px-3 py-2 dark:bg-slate-900" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <input className="w-full rounded-xl border px-3 py-2 dark:bg-slate-900" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <input className="w-full rounded-xl border px-3 py-2 dark:bg-slate-900" placeholder="Confirm password" type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} required />
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-slate-900">
              <option value="user">Customer</option>
              <option value="admin">Admin (requires backend ALLOW_PUBLIC_ADMIN)</option>
            </select>
          </label>
          <button type="submit" className="w-full rounded-full bg-brand-green py-3 text-sm font-bold text-white">
            Sign up
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account? <Link className="font-semibold text-brand-green" to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
