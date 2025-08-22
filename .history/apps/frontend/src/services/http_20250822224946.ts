// apps/frontend/src/services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1",
  timeout: 15000,
});

// ----- Request: attach token & tenantId (prefer activeTenantId) -----
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Axios v1 headers can be AxiosHeaders (with .set) or a plain object during build-time typing
  const setHeader = (k: string, v: string) => {
    // If AxiosHeaders instance
    const h: any = config.headers;
    if (h && typeof h.set === "function") {
      h.set(k, v);
    } else {
      // Fallback for plain object typing
      (config.headers as Record<string, string>)[k] = v;
    }
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const activeTenantId = localStorage.getItem("activeTenantId");
    const legacyTenantId = localStorage.getItem("tenantId");
    const tenantId = activeTenantId || legacyTenantId;

    if (token) setHeader("Authorization", `Bearer ${token}`);
    if (tenantId) setHeader("x-tenant-id", tenantId);
  }

  return config;
});

// ----- Response: auth handling -----
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      if (typeof window !== "undefined") {
        // Clear only token here; tenant can persist for re-login UX
        localStorage.removeItem("token");
        // Keep tenant IDs to preserve selection across sessions if desired:
        // localStorage.removeItem("activeTenantId");
        // localStorage.removeItem("tenantId");
        // Full reload to login screen
        window.location.replace("/loginPage"); // <-- change to "/login" if that's your route
      }
    }
    return Promise.reject(err);
  }
);

export default api;
