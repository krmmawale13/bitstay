import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

import KpiStrip from "@/components/dashboard/KpiStrip";
import RevenueTrend from "@/components/dashboard/RevenueTrend";
import BookingMixToday from "@/components/dashboard/BookingMixToday";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import QuickLinks from "@/components/dashboard/QucikLinks";
import PropertiesStrip, { type PropertyCard } from "@/components/dashboard/PropertiesStrip";

import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { useRevenue7d } from "@/hooks/useRevenue7d";
import { useBookingMixToday } from "@/hooks/useBookingMixToday";
import { useQuickLinks } from "@/hooks/useQuickLinks";

/* ------------------------ INLINE ACCESS HELPERS (LS) ------------------------ */
function readPerms(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("permissions");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function readRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;
    const cu = JSON.parse(raw);
    return cu?.role ?? null;
  } catch {
    return null;
  }
}
/** ADMIN => full access; else require ALL perms */
function hasAllOrAdmin(required: string[]) {
  const role = readRole();
  if (role === "ADMIN") return true;
  const set = new Set(readPerms());
  return required.every((k) => set.has(k));
}
/* --------------------------------------------------------------------------- */

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const sum = useDashboardSummary();
  const rev = useRevenue7d();
  const mix = useBookingMixToday();
  const ql = useQuickLinks();

  const inr = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  // TODO: replace with API when /dashboard/properties is available
  const hotels: PropertyCard[] = []; // or some static placeholders

  return (
    <div className="flex h-screen text-slate-900 dark:text-slate-100 relative">
      {/* background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.22),transparent_60%)] mix-blend-soft-light" />

      {/* layout ALWAYS visible */}
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="p-6 space-y-6 overflow-y-auto">
          {/* page header card */}
          <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow px-6 py-5">
            <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tenant overview — today’s KPIs, trends and exceptions.
            </p>
          </div>

          {/* CONTENT-ONLY GUARD */}
          {!hasAllOrAdmin(["dashboard.view"]) ? (
            <div className="rounded-2xl border border-amber-300/40 bg-amber-50/80 dark:bg-amber-900/40 backdrop-blur-xl shadow p-6">
              <div className="text-lg font-semibold mb-1">This area is locked</div>
              <p className="text-sm opacity-80">
                You don’t have permission to view the dashboard. You can still use the sidebar to navigate to allowed
                sections, or contact an admin if this seems wrong.
              </p>
            </div>
          ) : (
            <>
              <KpiStrip
                bookingsToday={sum.data?.bookingsToday}
                occupancyPct={sum.data?.occupancyPct}
                revenueToday={sum.data ? inr(sum.data.revenueToday.total) : undefined}
                invoicesDue={sum.data?.risks.invoicesDue}
                loading={sum.loading}
              />

              {/* Optional Properties strip (show when you have data) */}
              {hotels.length > 0 && <PropertiesStrip hotels={hotels} />}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <RevenueTrend data={rev.data} loading={rev.loading} />
                </div>
                <div>
                  <BookingMixToday data={mix.data} loading={mix.loading} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <QuickLinks items={ql.links} loading={ql.loading} />
                </div>
                <div>
                  <AlertsPanel
                    invoicesDue={sum.data?.risks.invoicesDue}
                    licensesExpiring30d={sum.data?.risks.licensesExpiring30d}
                    lowStockItems={sum.data?.risks.lowStockItems}
                    loading={sum.loading}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
