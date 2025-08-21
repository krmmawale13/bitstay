// src/services/auth.service.ts
import http from "@/lib/http";

type LoginResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    tenantId?: number;        // single-tenant schema
    activeTenantId?: number;  // multi-tenant payload (future-safe)
  };
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/auth/login", { email, password });

  const { token, user } = res.data;

  // persist for interceptors
  localStorage.setItem("token", token);

  // future-safe: prefer activeTenantId, else tenantId
  const tid = user.activeTenantId ?? user.tenantId;
  if (tid != null) {
    localStorage.setItem("activeTenantId", String(tid));
  } else {
    // optional: clear if not provided
    localStorage.removeItem("activeTenantId");
  }

  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("activeTenantId");
}
