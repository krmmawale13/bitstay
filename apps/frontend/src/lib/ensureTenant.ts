import { useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";

/**
 * Ensure there is an activeTenantId in localStorage before any API calls.
 * Safe for SSR and idempotent (does nothing if already set).
 */
export function useEnsureTenant() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // already set? do nothing
    const existing =
      localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");
    if (existing) return;

    // fallback from currentUser (works for single- & multi-tenant)
    const cu = getCurrentUser();
    const fallback =
      (Array.isArray(cu?.tenants) && cu.tenants[0]) || cu?.tenantId;

    if (fallback != null) {
      localStorage.setItem("activeTenantId", String(fallback));
    }
  }, []);
}
