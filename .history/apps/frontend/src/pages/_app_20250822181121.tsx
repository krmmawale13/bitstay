import type { AppProps } from "next/app";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import "@/styles/globals.css";

import { AuthProvider } from "@/context/AuthContext";
import http from "@/lib/http";
import { getCurrentUser, setActiveTenantId } from "@/lib/auth";

// ✅ Toasts (context + UI host)
import { ToastProvider } from "@/contexts/ToastContext";
import ToastHost from "@/components/ui/ToastHost";

// Public routes (no token required)
const PUBLIC_ROUTES = new Set<string>(["/login", "/loginpage"]);

// ---- NAV MAP (same as your Sidebar items) with required perms (ANY semantics for menu) ----
const NAV_ITEMS: Array<{ path: string; required?: string[] }> = [
  { path: "/dashboard", required: ["dashboard.view"] },
  { path: "/customers", required: ["customers.read"] },
  { path: "/bookings", required: ["bookings.read"] },
  { path: "/rooms", required: ["hotels.read"] },
  { path: "/bar", required: ["pos.use", "bars.read"] },
  { path: "/inventory", required: ["inventory.read"] },
  { path: "/reports", required: ["reports.view"] },
  { path: "/settings/access", required: ["dashboard.view"] },
];

function anyAllowed(perms: Set<string>, req?: string[]) {
  if (!req || req.length === 0) return true;
  return req.some((k) => perms.has(k));
}

function pickFirstAllowedPath(permsList: string[]): string | null {
  const perms = new Set(permsList || []);
  for (const item of NAV_ITEMS) {
    if (anyAllowed(perms, item.required)) return item.path;
  }
  return null;
}

// Nice glassy splash while booting
function Splash() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.25),transparent_60%)] mix-blend-soft-light" />
      <div className="relative z-10 min-h-screen grid place-items-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-white/25 bg-white/10 backdrop-blur-xl shadow-2xl p-6 text-center">
          <div className="mx-auto mb-3 h-11 w-11 rounded-xl bg-white/20 grid place-items-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
          </div>
          <div className="text-lg font-semibold">Preparing your workspace…</div>
          <div className="text-sm mt-1 text-white/80">Loading session & permissions</div>
        </div>
      </div>
    </div>
  );
}

// tiny helper so we can toast from here even before components mount
function pushToast(type: "success" | "error" | "info", message: string, description?: string) {
  try {
    (window as any).__toast?.push({ type, message, description });
  } catch {
    // noop
  }
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [booting, setBooting] = useState(true);

  const pathname = useMemo(() => router.pathname, [router.pathname]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        // No token: allow only public routes
        if (!token) {
          if (!PUBLIC_ROUTES.has(pathname)) {
            router.replace("/loginpage");
          }
          return;
        }

        // Ensure active tenant in LS (for backend guard + http interceptor)
        const existingTenant =
          localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");
        if (!existingTenant) {
          const cu = getCurrentUser();
          const fallbackTenant =
            (Array.isArray(cu?.tenants) && cu?.tenants?.[0]) || cu?.tenantId;
          if (fallbackTenant != null) {
            setActiveTenantId(String(fallbackTenant));
          }
        }

        // Load permissions (will set x-tenant-id via http interceptor)
        let permsList: string[] = [];
        try {
          const resp = await http.get<{ permissions: string[] }>("/auth/permissions");
          permsList = Array.isArray(resp.data?.permissions) ? resp.data.permissions : [];
          if (!cancelled) {
            localStorage.setItem("permissions", JSON.stringify(permsList));
          }
        } catch (err: any) {
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            // Session expired or not authorized → clear + redirect
            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            localStorage.removeItem("permissions");
            pushToast("error", "Session expired", "Please sign in again.");
            router.replace("/loginpage");
            return;
          }
          // fallback to cached perms if available
          if (!localStorage.getItem("permissions")) {
            localStorage.setItem("permissions", "[]");
          }
          permsList = JSON.parse(localStorage.getItem("permissions") || "[]");
          pushToast("info", "Working in limited mode", "Could not refresh permissions from server.");
        }

        // Smart landing / access fixups
        if (pathname === "/" || pathname === "/index") {
          const first = pickFirstAllowedPath(permsList);
          router.replace(first || "/loginpage");
          return;
        }

        const current = NAV_ITEMS.find((i) => i.path === pathname);
        if (current && !anyAllowed(new Set(permsList), current.required)) {
          const first = pickFirstAllowedPath(permsList);
          pushToast("error", "Access denied", "Redirected to an allowed page.");
          router.replace(first || "/loginpage");
          return;
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token && PUBLIC_ROUTES.has(pathname)) {
      setBooting(false);
      return;
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (booting) return (
    <ToastProvider>
      <Splash />
      <ToastHost />
    </ToastProvider>
  );

  return (
    <ToastProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
      <ToastHost />
    </ToastProvider>
  );
}
