// src/services/http.ts
import axios from 'axios';

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: false,
});

export function setAuth(token?: string) {
  if (token) http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete http.defaults.headers.common['Authorization'];
}
