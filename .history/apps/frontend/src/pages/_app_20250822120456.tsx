import type { AppProps } from "next/app";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import "@/styles/globals.css";

import { AuthProvider } from "@/context/AuthContext";
import http from "@/lib/http";
import { getCurrentUser, setActiveTenantId } from "@/lib/auth";

// Public routes (no token required)
const PUBLIC_ROUTES = new Set<string>(["/login", "/loginpage"]);

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

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [booting, setBooting] = useState(true);

  // normalize path without query/hash for PUBLIC_ROUTES check
  const pathname = useMemo(() => router.pathname, [router.pathname]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        // 1) Read token
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        // 2) If no token and route is private → go login
        if (!token) {
          if (!PUBLIC_ROUTES.has(pathname)) {
            router.replace("/loginpage");
            return;
          }
          // Public page: nothing else to do
          return;
        }

        // 3) Ensure tenant id exists (activeTenantId || tenantId || from currentUser)
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

        // 4) Ensure permissions in LS
        //    - We’ll try to fetch from backend: GET /auth/permissions
        //    - If it fails with 401 → clear & go login
        //    - If it fails otherwise → keep old LS or set []
        try {
          const resp = await http.get<{ permissions: string[] }>("/auth/permissions");
          if (!cancelled) {
            const list = Array.isArray(resp.data?.permissions) ? resp.data.permissions : [];
            localStorage.setItem("permissions", JSON.stringify(list));
          }
        } catch (err: any) {
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            // session expired → clean & go login
            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            localStorage.removeItem("permissions");
            // keep rememberEmail as-is
            router.replace("/loginpage");
            return;
          }
          // soft-fail: keep whatever was in LS (or empty)
          if (!localStorage.getItem("permissions")) {
            localStorage.setItem("permissions", "[]");
          }
        }

        // 5) Optional smart redirect from / to /dashboard when logged-in
        if (pathname === "/" || pathname === "/index") {
          router.replace("/dashboard");
          return;
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    // Boot rules:
    // - If on public route and no token → no blocking splash (booting=false)
    // - Else run bootstrap (show splash until done)
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

  // Show splash while booting protected areas
  if (booting) return <Splash />;

  // App render (global AuthProvider stays)
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
