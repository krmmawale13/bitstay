// src/lib/http.ts
import axios, { type AxiosError, type AxiosResponse } from "axios";


const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1";

/** Optional: non-breaking toast bridge */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__toast && typeof w.__toast.push === "function") {
    w.__toast.push({ type, message, description });
  }
  // also emit a CustomEvent for anyone listening
  try {
    window.dispatchEvent(
      new CustomEvent("app:toast", { detail: { type, message, description } })
    );
  } catch {
    /* no-op */
  }
}

export const http = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: {
    Accept: "application/json",
  },
});

// -------------------- REQUEST INTERCEPTOR --------------------
http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const activeTenantId =
      localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");

    config.headers = config.headers ?? {};

    if (token) {
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
    if (activeTenantId) {
      // Backend TenantGuard/TenantId decorator yahi header padhega
      (config.headers as any)["x-tenant-id"] = activeTenantId;
    }
  }
  return config;
});

// -------------------- RESPONSE INTERCEPTOR --------------------
http.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError<any>) => {
    // Network/timeout?
    if (!err.response) {
      toast("error", "Network error", "Please check your connection and try again.");
      return Promise.reject(err);
    }

    const status = err.response.status;
    // Normalize a few common backend error messages
    const msg =
      (err.response.data as any)?.message ||
      (err.response.data as any)?.error ||
      err.message ||
      `Request failed (${status})`;

    // 401/403 → session expired or forbidden
    if (status === 401 || status === 403) {
      if (typeof window !== "undefined") {
        // Avoid loops if already at login
        const path = window.location.pathname.toLowerCase();
        const alreadyAtLogin = path === "/loginPage" || path === "/loginPage";

        // Clear auth but keep rememberEmail
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("permissions");
        localStorage.removeItem("activeTenantId"); // optional: clear to force re-bootstrap

        if (!alreadyAtLogin) {
          toast("info", "Session ended", "Please sign in again.");
          // Use replace to avoid back button returning to broken state
          window.location.replace("/loginPage");
        }
      }
      return Promise.reject(err);
    }

    // 429 Too Many Requests
    if (status === 429) {
      toast("error", "Too many requests", "Please slow down and try again shortly.");
      return Promise.reject(err);
    }

    // 5xx server errors
    if (status >= 500) {
      toast("error", "Server error", msg);
      return Promise.reject(err);
    }

    // Other 4xx → surface message but don't redirect
    if (status >= 400) {
      toast("error", "Request failed", msg);
    }

    return Promise.reject(err);
  }
);

export default http;
