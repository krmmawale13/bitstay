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

export function setCurrentUser(u: CurrentUser | null) {
  if (typeof window === "undefined") return;
  if (!u) {
    localStorage.removeItem("currentUser");
    return;
  }
  // ensure first/last for UI
  if (!u.first_name && u.name) {
    const [fn, ...rest] = String(u.name).split(" ");
    u.first_name = fn;
    u.last_name = rest.join(" ");
  }
  localStorage.setItem("currentUser", JSON.stringify(u));
}

/** Try localStorage(currentUser); else return a demo admin (for dev only). */
export function getCurrentUser(): CurrentUser | null {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("currentUser");
      if (raw) {
        const u = JSON.parse(raw) as CurrentUser;
        if (!u.first_name && u.name) {
          const [fn, ...rest] = String(u.name).split(" ");
          u.first_name = fn;
          u.last_name = rest.join(" ");
        }
        return u;
      }
    } catch {}
  }
  return {
    id: 1,
    name: "Demo Admin",
    role: "ADMIN",
    email: "admin@bitstay.com",
    first_name: "Demo",
    last_name: "Admin",
  };
}

/** Placeholder: wire redirect logic here if you add protected routes. */
export function requireAuth(): void {
  // no-op for now
}
