import http from "@/lib/http";
import { setCurrentUser, type CurrentUser } from "@/lib/auth";

type LoginResponse = {
  token: string;
  user: CurrentUser & {
    // backend can send either `tenantId` or `tenants: number[]`
    tenantId?: number;
    tenants?: number[];
  };
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/auth/login", { email, password });

  const { token, user } = res.data;

  // 1) persist token for interceptor
  localStorage.setItem("token", token);

  // 2) pick an active tenant (multi- OR single-tenant)
  const active =
    (Array.isArray(user.tenants) && user.tenants.length ? user.tenants[0] : undefined) ??
    user.tenantId ??
    null;

  if (active != null) {
    localStorage.setItem("activeTenantId", String(active));
  } else {
    localStorage.removeItem("activeTenantId");
  }

  // 3) persist currentUser for UI
  setCurrentUser(user);

  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("activeTenantId");
  localStorage.removeItem("currentUser");
}
