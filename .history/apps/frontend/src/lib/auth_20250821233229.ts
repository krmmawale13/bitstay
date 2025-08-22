// apps/frontend/src/lib/auth.ts
export type RoleEnum =
  | "ADMIN"
  | "MANAGER"
  | "RECEPTIONIST"
  | "CASHIER"
  | "WAITER"
  | "HOUSEKEEPING";

export type CurrentUser = {
  id: number;
  name: string;
  role: RoleEnum | string;
  email: string;
  first_name?: string;
  last_name?: string;
  tenantId?: number;     // single-tenant (optional)
  tenants?: number[];    // multi-tenant (optional)
};

/** Persist the current user for the UI (localStorage). */
export function setCurrentUser(u: CurrentUser | null) {
  if (typeof window === "undefined") return;
  if (!u) {
    localStorage.removeItem("currentUser");
    return;
  }
  // normalize first/last for UI convenience
  if (!u.first_name && u.name) {
    const [fn, ...rest] = String(u.name).trim().split(" ");
    u.first_name = fn || undefined;
    u.last_name = rest.join(" ") || undefined;
  }
  localStorage.setItem("currentUser", JSON.stringify(u));
}

/** Read the real logged-in user only. No demo fallback. */
export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;
    const u = JSON.parse(raw) as CurrentUser;
    if (!u.first_name && u.name) {
      const [fn, ...rest] = String(u.name).trim().split(" ");
      u.first_name = fn || undefined;
      u.last_name = rest.join(" ") || undefined;
    }
    return u;
  } catch {
    return null;
  }
}

/** Canonical way to read active tenant id set by login/topbar (as string). */
export function getActiveTenantId(): string | null {
  if (typeof window === "undefined") return null;
  // keep both keys for backward compatibility across modules
  return (
    localStorage.getItem("activeTenantId") ||
    localStorage.getItem("tenantId") ||
    null
  );
}

/** Optional: helper to persist active tenant id consistently. */
export function setActiveTenantId(id: number | string | null): void {
  if (typeof window === "undefined") return;
  if (id === null || id === undefined || id === "") {
    localStorage.removeItem("activeTenantId");
    localStorage.removeItem("tenantId");
    return;
  }
  const v = String(id);
  localStorage.setItem("activeTenantId", v); // canonical
  localStorage.setItem("tenantId", v);       // legacy compatibility
}

/** Placeholder: add redirect logic if you introduce protected routes. */
export function requireAuth(): void {
  // e.g., if (!getCurrentUser()) router.push('/login')
}
