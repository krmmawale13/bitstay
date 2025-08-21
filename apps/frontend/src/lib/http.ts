// src/lib/http.ts
import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1";

// NOTE: withCredentials ki zaroorat nahi jab Bearer token bhej rahe ho
export const http = axios.create({
  baseURL: API_BASE,
});

http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const activeTenantId =
      localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");

    config.headers = config.headers ?? {};

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    if (activeTenantId) {
      // Backend TenantGuard/TenantId decorator yahi header padhega
      config.headers["x-tenant-id"] = activeTenantId;
    }
  }
  return config;
});

export default http;
