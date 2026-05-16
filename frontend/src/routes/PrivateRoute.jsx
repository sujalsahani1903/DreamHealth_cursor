import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
