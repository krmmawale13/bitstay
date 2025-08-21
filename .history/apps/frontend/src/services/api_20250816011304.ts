
import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', // tumhara backend URL
  timeout: 10000,
});

// ✅ Request interceptor to add token & tenantId
api.interceptors.request.use((config: AxiosRequestConfig) => {
  if (!config.headers) {
    config.headers = {};
  }

  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId; // Tumhare backend guard ke hisaab se
  }

  return config;
});

// ✅ Response interceptor for handling auth errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response && [401, 403].includes(error.response.status)) {
      localStorage.removeItem('token');
      localStorage.removeItem('tenantId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ✅ Helper methods
export const get = <T>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config);
export const post = <T>(url: string, data?: any, config?: AxiosRequestConfig) => api.post<T>(url, data, config);
export const put = <T>(url: string, data?: any, config?: AxiosRequestConfig) => api.put<T>(url, data, config);
export const del = <T>(url: string, config?: AxiosRequestConfig) => api.delete<T>(url, config);

export default api;
