import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export function clearAuthStorage() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("auth:session-cleared"));
}

// TODO: httpOnly cookies would be nicer than localStorage for tokens
let refreshPromise = null;

export async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post(`${baseURL}/api/auth/refresh`, { refresh_token: refresh })
    .then(({ data }) => {
      localStorage.setItem("access_token", data.access_token);
      return data.access_token;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const access = await refreshAccessToken();
        if (access) {
          original.headers.Authorization = `Bearer ${access}`;
          return api(original);
        }
      } catch {
        // refresh failed — AuthProvider will clear session
      }
    }
    return Promise.reject(error);
  }
);
