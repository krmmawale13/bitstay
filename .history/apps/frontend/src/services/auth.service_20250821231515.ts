// apps/frontend/src/services/auth.service.ts
import http from "@/lib/http";
import { setCurrentUser, type CurrentUser } from "@/lib/auth";

// Optionally allow a default tenant from env (for local/dev)
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;

type LoginResponse = {
  token: string;
  user: CurrentUser & {
    // backend may send either; ids can be number|string
    tenantId?: number | string | null;
    tenants?: Array<number | string> | null;
  };
};

/** Normalize a value to string id (for headers/localStorage). Returns null if invalid. */
function asTenantIdString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return String(n);
}

/** Try to pick a robust active tenant id from user + existing storage + env fallback. */
function pickActiveTenantId(user: LoginResponse["user"]): string | null {
  // 1) Prefer explicit array of tenant ids (multi-tenant)
  if (Array.isArray(user.tenants) && user.tenants.length > 0) {
    const first = asTenantIdString(user.tenants[0]);
    if (first) return first;
  }
  // 2) Fall back to single-tenant field
  const single = asTenantIdString(user.tenantId);
  if (single) return single;

  // 3) If neither present, keep previous selection if any (prevents flicker on re-login)
  if (typeof window !== "undefined") {
    const prior = localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");
    if (prior) {
      const ok = asTenantIdString(prior);
      if (ok) return ok;
    }
  }

  // 4) Last resort: env default (useful in dev)
  if (DEFAULT_TENANT != null) {
    const envId = asTenantIdString(DEFAULT_TENANT);
    if (envId) return envId;
  }

  return null;
}

/** Persist both legacy and canonical keys for maximum compatibility across modules. */
function setTenantLocally(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem("activeTenantId", id); // canonical
    localStorage.setItem("tenantId", id);       // legacy compatibility (some modules read this)
  } else {
    localStorage.removeItem("activeTenantId");
    localStorage.removeItem("tenantId");
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/auth/login", { email, password });
  const { token, user } = res.data;

  // 1) store token (axios interceptor will attach Authorization)
  localStorage.setItem("token", token);

  // 2) choose & persist active tenant (covers multi/single-tenant & fallbacks)
  const activeTenant = pickActiveTenantId(user);
  setTenantLocally(activeTenant);

  // 3) persist current user (UI reads via getCurrentUser())
  //    also keep name split logic inside setCurrentUser utility.
  setCurrentUser(user);

  return res.data;
}

export function logout() {
  // remove everything the app may rely on
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("activeTenantId");
  localStorage.removeItem("tenantId");
}
