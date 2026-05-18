import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { loginWithTokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      loginWithTokens(data.access_token, data.refresh_token, data.user);
      toast.success("Welcome back");
      navigate(data.user.role === "admin" ? "/" : redirectTo);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Helmet>
        <title>Login — Dream Health Foods</title>
      </Helmet>
      <div className="glass rounded-3xl p-8">
        <h1 className="font-display text-3xl font-bold text-brand-green dark:text-emerald-100">Welcome back</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border px-3 py-2 dark:bg-slate-900"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
          />
          <input
            className="w-full rounded-xl border px-3 py-2 dark:bg-slate-900"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            autoComplete="current-password"
          />
          <button type="submit" className="w-full rounded-full bg-brand-green py-3 text-sm font-bold text-white">
            Sign in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          New here?{" "}
          <Link className="font-semibold text-brand-green" to="/register">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link className="text-slate-500" to="/forgot">
            Forgot password
          </Link>
        </p>
      </div>
    </div>
  );
}
