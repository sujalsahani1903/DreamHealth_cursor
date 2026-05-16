import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";

export default function Verify() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const purpose = params.get("purpose") || "signup";
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/api/auth/verify-otp", { email, otp, purpose });
      if (purpose === "signup") {
        toast.success(data.message || "Verified");
        navigate("/login");
      } else if (purpose === "forgot_password") {
        navigate(`/reset?token=${encodeURIComponent(data.reset_token)}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Helmet>
        <title>Verify email</title>
      </Helmet>
      <div className="glass rounded-3xl p-8">
        <h1 className="font-display text-3xl font-bold text-brand-green">Verify OTP</h1>
        <p className="mt-2 text-sm text-slate-600">Email: {email}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="w-full rounded-xl border px-3 py-2 dark:bg-slate-900" placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
          <button type="submit" className="w-full rounded-full bg-brand-green py-3 text-sm font-bold text-white">
            Verify
          </button>
          <button
            type="button"
            className="w-full text-sm text-brand-green"
            onClick={() => api.post("/api/auth/send-otp", { email, purpose }).then(() => toast.success("OTP resent"))}
          >
            Resend OTP
          </button>
        </form>
        <Link to="/login" className="mt-6 block text-center text-sm text-slate-500">
          Back to login
        </Link>
      </div>
    </div>
  );
}
