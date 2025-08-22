// src/services/http.ts
import axios, { AxiosHeaders, InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1",
  withCredentials: true,
  timeout: 15000,
});

// ----- Request interceptor: attach token & tenantId -----
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headers =
    (config.headers = config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers));

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const tenantId =
      localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (tenantId && !headers.has("x-tenant-id")) {
      headers.set("x-tenant-id", tenantId);
    }
  }

  return config;
});

// ----- Response interceptor: handle auth errors -----
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      if (typeof window !== "undefined") {
        // Clear sensitive data
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("permissions");
        // keep tenantId if your flow depends on pre-selection
        window.dispatchEvent(new Event("permissions:updated"));
        window.location.href = "/loginPage";
      }
    }
    return Promise.reject(err);
  }
);
