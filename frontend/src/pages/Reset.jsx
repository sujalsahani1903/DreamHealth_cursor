import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";

export default function Reset() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/auth/reset-password", { reset_token: token, new_password: password, confirm_password: confirm });
      toast.success("Password updated");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Helmet>
        <title>Reset password</title>
      </Helmet>
      <div className="glass rounded-3xl p-8">
        <h1 className="font-display text-2xl font-bold text-brand-green">New password</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="w-full rounded-xl border px-3 py-2 dark:bg-slate-900" type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input className="w-full rounded-xl border px-3 py-2 dark:bg-slate-900" type="password" placeholder="Confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <button className="w-full rounded-full bg-brand-green py-3 text-sm font-bold text-white" type="submit">
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
