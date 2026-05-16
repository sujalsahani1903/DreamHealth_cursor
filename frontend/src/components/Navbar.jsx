import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const nav = [
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-brand-cream/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Dream Health Foods" className="h-10 w-10 rounded-full border border-brand-gold/40 object-cover" />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold text-brand-green dark:text-emerald-200">Dream Health Foods</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Healthy Grains For Healthy Life</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? "text-brand-green" : "text-slate-600 hover:text-brand-green dark:text-slate-300"}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={toggle}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold dark:border-slate-700"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          {user ? (
            <>
              <Link to="/cart" className="text-sm font-semibold text-brand-green">
                Cart
              </Link>
              <Link to="/dashboard/wishlist" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Wishlist
              </Link>
              {isAdmin ? (
                <Link to="/admin" className="text-sm font-semibold text-brand-gold">
                  Admin
                </Link>
              ) : (
                <Link to="/dashboard" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Account
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="rounded-full bg-brand-green px-4 py-2 text-xs font-bold text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-brand-gold px-4 py-2 text-xs font-bold text-brand-green shadow-sm"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button type="button" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          <span className="text-2xl">☰</span>
        </button>
      </div>

      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-800">
          <div className="flex flex-col gap-3">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="text-sm font-semibold">
                {n.label}
              </Link>
            ))}
            <button type="button" onClick={toggle} className="text-left text-sm font-semibold">
              Toggle {theme === "dark" ? "light" : "dark"} mode
            </button>
            {user ? (
              <>
                <Link to="/cart" onClick={() => setOpen(false)}>
                  Cart
                </Link>
                <Link to="/dashboard/wishlist" onClick={() => setOpen(false)}>
                  Wishlist
                </Link>
                <Link to={isAdmin ? "/admin" : "/dashboard"} onClick={() => setOpen(false)}>
                  {isAdmin ? "Admin" : "Account"}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                    navigate("/");
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link to="/register" onClick={() => setOpen(false)}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
}
