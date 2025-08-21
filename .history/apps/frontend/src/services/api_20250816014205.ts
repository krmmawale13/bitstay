// apps/frontend/src/services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1",
  timeout: 15000,
});

// ----- Request: attach token & tenantId -----
api.interceptors.request.use((config) => {
  // ensure headers object
  if (!config.headers) config.headers = {};

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const tenantId = localStorage.getItem("tenantId");

    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    if (tenantId) config.headers["x-tenant-id"] = tenantId;
  }

  return config;
});

// ----- Response: auth handling -----
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        // tenant selection app flow mein ho sakta hai isliye usko na chheḍeñ
        // localStorage.removeItem("tenantId");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
