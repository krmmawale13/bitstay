// apps/frontend/src/services/http.ts
import axios from "axios";

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true, // so cookies (httpOnly JWT) flow automatically
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    // Bubble up the exact error message (handy during integration)
    return Promise.reject(err?.response?.data ?? err);
  }
);
