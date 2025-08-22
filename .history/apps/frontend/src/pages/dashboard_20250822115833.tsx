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

/* -------------------------------------------------------------------------- */
/* ACCESS + TOAST HELPERS (inline, non-breaking, ADMIN override + future-safe) */
/* -------------------------------------------------------------------------- */
function readLS<T = any>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readPerms(): string[] {
  return readLS<string[]>("permissions", []);
}

function readRole(): string | null {
  const cu = readLS<any>("currentUser", null);
  return cu?.role ?? null;
}

/** ADMIN => full access; else require ALL perms */
function hasAllOrAdmin(required: string[]) {
  const role = readRole();
  if (role === "ADMIN") return true;
  const set = new Set(readPerms());
  return required.every((k) => set.has(k));
}

/** Non-breaking toast. If a global toaster exists later, this will use it automatically. */
function notify(
  type: "success" | "error" | "info",
  message: string,
  opts?: { description?: string }
) {
  if (typeof window === "undefined") return;
  if ((window as any).__toast && typeof (window as any).__toast.push === "function") {
    (window as any).__toast.push({ type, message, description: opts?.description });
  } else {
    console.log(`[toast:${type}] ${message}`, opts?.description ?? "");
  }
}

/** Reusable inline "locked" card for sections/widgets */
function InlineLock({ title, note }: { title: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-amber-300/40 bg-amber-50/80 dark:bg-amber-900/40 backdrop-blur-xl shadow p-6">
      <div className="text-sm font-semibold mb-1">{title}</div>
      <p className="text-xs opacity-80">
        {note ?? "You don’t have permission to view this section."}
      </p>
    </div>
  );
}
/* -------------------------------------------------------------------------- */

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const sum = useDashboardSummary();
  const rev = useRevenue7d();
  const mix = useBookingMixToday();
  const ql = useQuickLinks();

  const inr = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

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

          {/* CONTENT-ONLY GUARD FOR WHOLE DASHBOARD CONTENT */}
          {!hasAllOrAdmin(["dashboard.view"]) ? (
            <div className="rounded-2xl border border-amber-300/40 bg-amber-50/80 dark:bg-amber-900/40 backdrop-blur-xl shadow p-6">
              <div className="text-lg font-semibold mb-1">This area is locked</div>
              <p className="text-sm opacity-80">
                You don’t have permission to view the dashboard. You can still use the sidebar to navigate to allowed sections,
                or contact an admin if this seems wrong.
              </p>
            </div>
          ) : (
            <>
              {/* KPIs — usually allowed with dashboard.view */}
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
                  {/* RevenueTrend → require reports.view */}
                  {hasAllOrAdmin(["reports.view"]) ? (
                    <RevenueTrend data={rev.data} loading={rev.loading} />
                  ) : (
                    <InlineLock
                      title="Revenue Trend is locked"
                      note="Requires reports.view"
                    />
                  )}
                </div>
                <div>
                  {/* BookingMixToday → require bookings.read */}
                  {hasAllOrAdmin(["bookings.read"]) ? (
                    <BookingMixToday data={mix.data} loading={mix.loading} />
                  ) : (
                    <InlineLock
                      title="Booking Mix is locked"
                      note="Requires bookings.read"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  {/* QuickLinks → keep open with dashboard.view (already satisfied) */}
                  <QuickLinks items={ql.links} loading={ql.loading} />
                </div>
                <div>
                  {/* AlertsPanel → good with reports.view OR keep open for overview */}
                  {hasAllOrAdmin(["reports.view"]) ? (
                    <AlertsPanel
                      invoicesDue={sum.data?.risks.invoicesDue}
                      licensesExpiring30d={sum.data?.risks.licensesExpiring30d}
                      lowStockItems={sum.data?.risks.lowStockItems}
                      loading={sum.loading}
                    />
                  ) : (
                    <InlineLock
                      title="Alerts are limited"
                      note="Some alerts require reports.view"
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
