import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  /** Bumps when tokens change so stale /api/auth/profile responses cannot clear a fresh session. */
  const authEpoch = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    const epoch = authEpoch.current;
    let cancelled = false;
    api
      .get("/api/auth/profile")
      .then((r) => {
        if (cancelled || epoch !== authEpoch.current) return;
        setUser(r.data);
        localStorage.setItem("user", JSON.stringify(r.data));
      })
      .catch(() => {
        if (cancelled || epoch !== authEpoch.current) return;
        setUser(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
      })
      .finally(() => {
        if (!cancelled && epoch === authEpoch.current) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithTokens = (access, refresh, u) => {
    authEpoch.current += 1;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    setLoading(false);
  };

  const logout = async () => {
    authEpoch.current += 1;
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* ignore */
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    setLoading(false);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      loginWithTokens,
      logout,
      isAdmin: user?.role === "admin",
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
