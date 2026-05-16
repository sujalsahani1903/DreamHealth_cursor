import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/auth/forgot-password", { email });
      toast.success("If the account exists, an OTP was sent");
      navigate(`/verify?email=${encodeURIComponent(email)}&purpose=forgot_password`);
    } catch {
      toast.error("Could not send OTP");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Helmet>
        <title>Forgot password</title>
      </Helmet>
      <div className="glass rounded-3xl p-8">
        <h1 className="font-display text-2xl font-bold text-brand-green">Forgot password</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="w-full rounded-xl border px-3 py-2 dark:bg-slate-900" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <button className="w-full rounded-full bg-brand-green py-3 text-sm font-bold text-white" type="submit">
            Send OTP
          </button>
        </form>
      </div>
    </div>
  );
}
