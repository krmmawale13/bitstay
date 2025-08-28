// apps/frontend/src/services/http.ts
import axios, { AxiosError } from "axios";

/**
 * Base URL:
 * - Prefer NEXT_PUBLIC_API_BASE_URL from .env
 * - Fallback to relative "/api/v1" (works with same-origin proxy)
 */
const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

const http = axios.create({
  baseURL,
  withCredentials: true, // send httpOnly cookie if you're using it
  timeout: 30000,
});

/**
 * Request interceptor:
 * - Inject x-tenant-id (from localStorage/sessionStorage) for TenantGuard
 * - Attach Authorization Bearer only if a token exists (cookie-first setup still works)
 * - Ensure JSON headers
 */
http.interceptors.request.use((config) => {
  // tenant id
  try {
    const tid =
      (typeof window !== "undefined" &&
        (localStorage.getItem("tenantId") ||
          sessionStorage.getItem("tenantId"))) || undefined;
    if (tid) {
      config.headers = {
        ...(config.headers || {}),
        "x-tenant-id": tid,
      };
    }
  } catch {}

  // bearer (optional; safe if you're using cookies)
  try {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("token")
        : null;
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  } catch {}

  // default JSON headers
  config.headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(config.headers || {}),
  };

  return config;
});

/**
 * Response interceptor:
 * - Normalize Nest ValidationPipe errors to readable strings
 * - Otherwise bubble up server payload as-is
 */
http.interceptors.response.use(
  (r) => r,
  (err: AxiosError<any>) => {
    const payload = err?.response?.data;
    if (payload) {
      if (typeof payload === "object" && payload?.message) {
        const msg = Array.isArray(payload.message)
          ? payload.message.join(" ")
          : payload.message;
        return Promise.reject(msg || payload);
      }
      return Promise.reject(payload);
    }
    return Promise.reject(err?.message || err);
  }
);

export { http };
export default http;
