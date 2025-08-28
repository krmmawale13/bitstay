// apps/frontend/src/services/auth.service.ts
import http from "@/lib/http";
import {
  setCurrentUser,
  type CurrentUser,
  finalizeLoginSession,   // hydrates /auth/permissions + dispatches "permissions:updated"
  clearPermissions,       // clears LS.permissions + event
} from "@/lib/auth";

const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;

type LoginResponse = {
  token: string;
  user: CurrentUser & {
    tenantId?: number | string | null;
    tenants?: Array<number | string> | null;
  };
};

function asTenantIdString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return String(n);
}

function pickActiveTenantId(user: LoginResponse["user"]): string | null {
  if (Array.isArray(user.tenants) && user.tenants.length > 0) {
    const first = asTenantIdString(user.tenants[0]);
    if (first) return first;
  }
  const single = asTenantIdString(user.tenantId);
  if (single) return single;

  if (typeof window !== "undefined") {
    const prior = localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");
    const ok = asTenantIdString(prior);
    if (ok) return ok;
  }

  if (DEFAULT_TENANT != null) {
    const envId = asTenantIdString(DEFAULT_TENANT);
    if (envId) return envId;
  }
  return null;
}

function setTenantLocally(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem("activeTenantId", id); // canonical
    localStorage.setItem("tenantId", id);       // legacy
  } else {
    localStorage.removeItem("activeTenantId");
    localStorage.removeItem("tenantId");
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  // 🔒 avoid stale perms from previous session
  clearPermissions();

  try {
    const res = await http.post<LoginResponse>("/auth/login", { email, password });
    const { token, user } = res.data;

    // 1) token first (axios interceptor uses it)
    localStorage.setItem("token", token);

    // 2) tenant selection
    const activeTenant = pickActiveTenantId(user);
    setTenantLocally(activeTenant);

    // 3) user profile (for role, avatar, etc.)
    setCurrentUser(user);

    // 4) effective permissions (user+tenant)
    await finalizeLoginSession(user);

    return res.data;
  } catch (err) {
    // rollback to a clean state on any failure
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    setTenantLocally(null);
    clearPermissions();
    throw err;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  setTenantLocally(null);
  clearPermissions();
}
