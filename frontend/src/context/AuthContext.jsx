import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, clearAuthStorage, refreshAccessToken } from "../services/api";

const AuthContext = createContext(null);

function readCachedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser);
  const [loading, setLoading] = useState(true);
  const authEpoch = useRef(0);

  const clearSession = useCallback(() => {
    authEpoch.current += 1;
    clearAuthStorage();
    setUser(null);
    setLoading(false);
  }, []);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    const refresh = localStorage.getItem("refresh_token");
    if (!token && !refresh) {
      setUser(null);
      setLoading(false);
      return;
    }

    const epoch = authEpoch.current;

    const fetchProfile = async () => {
      const { data } = await api.get("/api/auth/profile");
      return data;
    };

    try {
      let profile = await fetchProfile();
      if (epoch !== authEpoch.current) return;
      setUser(profile);
      localStorage.setItem("user", JSON.stringify(profile));
    } catch (err) {
      if (epoch !== authEpoch.current) return;

      const status = err.response?.status;

      if (status === 401 && refresh) {
        try {
          await refreshAccessToken();
          if (epoch !== authEpoch.current) return;
          const profile = await fetchProfile();
          if (epoch !== authEpoch.current) return;
          setUser(profile);
          localStorage.setItem("user", JSON.stringify(profile));
          setLoading(false);
          return;
        } catch {
          clearSession();
          return;
        }
      }

      if (status === 401) {
        clearSession();
        return;
      }

      // Network / server errors: keep cached user so Stripe return does not log out
      const cached = readCachedUser();
      if (cached) setUser(cached);
    } finally {
      if (epoch === authEpoch.current) setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const onCleared = () => setUser(null);
    window.addEventListener("auth:session-cleared", onCleared);
    return () => window.removeEventListener("auth:session-cleared", onCleared);
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!localStorage.getItem("refresh_token")) return;
      const token = localStorage.getItem("access_token");
      if (!token) {
        refreshAccessToken()
          .then(() => bootstrap())
          .catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [bootstrap]);

  const loginWithTokens = (access, refresh, u) => {
    authEpoch.current += 1;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* ignore */
    }
    clearSession();
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      loginWithTokens,
      logout,
      refreshSession: bootstrap,
      isAdmin: user?.role === "admin",
    }),
    [user, loading, bootstrap, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
