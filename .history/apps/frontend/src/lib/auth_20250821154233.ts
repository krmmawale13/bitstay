// apps/frontend/src/lib/auth.ts

export type CurrentUser = {
  id: number;
  name: string;
  role: "ADMIN" | "MANAGER" | "RECEPTIONIST" | "CASHIER" | "WAITER" | "HOUSEKEEPING" | string;
  email: string;
  first_name?: string;
  last_name?: string;
};

/**
 * Simple, synchronous placeholder until real /me is wired.
 * Tries localStorage(currentUser) first; else returns demo admin.
 */
export function getCurrentUser(): CurrentUser | null {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("currentUser");
      if (raw) {
        const u = JSON.parse(raw);
        // ensure minimum fields exist
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

/**
 * Placeholder. If you need route protection later, implement redirect here.
 * Export exists so `import { requireAuth }` doesn't break TS.
 */
export function requireAuth(): void {
  // no-op for now
}
