import { useEffect, useMemo, useState } from "react";
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
/* ACCESS + TOAST HELPERS (robust, case-insensitive ADMIN, ready-state aware) */
/* -------------------------------------------------------------------------- */
function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function useLS<T>(key: string, fallback: T): T {
  const [val, setVal] = useState<T>(() => readJSON<T>(key, fallback));
  useEffect(() => {
    const onStorage = () => setVal(readJSON<T>(key, fallback));
    // local updates (same tab)
    const id = setInterval(onStorage, 300); // cheap polling avoids cross-file event bus
    // cross-tab updates
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(id);
      window.removeEventListener("storage", onStorage);
    };
  }, [key, fallback]);
  return val;
}

function usePerms() {
  const perms = useLS<string[]>("permissions", []);
  // consider "ready" when permissions key exists in LS (even if empty array)
  const ready = useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("permissions") !== null;
  }, [perms]);
  return { perms, ready };
}

function useRole() {
  const cu = useLS<any>("currentUser", null);
  const role: string | null = cu?.role ?? null;
  return role;
}

function isAdmin(role: string | null): boolean {
  if (!role) return false;
  return String(role).toUpperCase() === "ADMIN";
}

function hasAll(permsList: string[], required: string[]) {
  if (!required?.length) return true;
  const set = new Set(permsList || []);
  return required.every((k) => set.has(k));
}

/** Non-breaking toast helper (future-safe). */
function notify(
  type: "success" | "error" | "info",
  message: string,
  opts?: { description?: string }
) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  if (api && typeof api.push === "function") {
    api.push({ type, message, description: opts?.description });
  } else {
    console.log(`[toast:${type}] ${message}`, opts?.description ?? "");
  }
}

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

function InlineSkeleton({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl shadow p-6">
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="h-3 w-40 rounded bg-black/10 dark:bg-white/10 animate-pulse mb-2" />
      <div className="h-3 w-64 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
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

  const { perms, ready: permsReady } = usePerms();
  const role = useRole();

  const inr = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  // TODO: replace with API when /dashboard/properties is available
  const hotels: PropertyCard[] = []; // or some static placeholders

  // page access decision
  const pageRequired = ["dashboard.view"];
  const canViewPage = isAdmin(role) || hasAll(perms, pageRequired);

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

          {/* CONTENT-ONLY AREA */}
          {!permsReady ? (
            <InlineSkeleton title="Loading permissions…" />
          ) : !canViewPage ? (
            <div className="rounded-2xl border border-amber-300/40 bg-amber-50/80 dark:bg-amber-900/40 backdrop-blur-xl shadow p-6">
              <div className="text-lg font-semibold mb-1">This area is locked</div>
              <p className="text-sm opacity-80">
                You don’t have permission to view the dashboard. Use the sidebar to navigate to allowed sections,
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
                  {isAdmin(role) || hasAll(perms, ["reports.view"]) ? (
                    <RevenueTrend data={rev.data} loading={rev.loading} />
                  ) : !permsReady ? (
                    <InlineSkeleton title="Loading Revenue Trend…" />
                  ) : (
                    <InlineLock title="Revenue Trend is locked" note="Requires reports.view" />
                  )}
                </div>
                <div>
                  {/* BookingMixToday → require bookings.read */}
                  {isAdmin(role) || hasAll(perms, ["bookings.read"]) ? (
                    <BookingMixToday data={mix.data} loading={mix.loading} />
                  ) : !permsReady ? (
                    <InlineSkeleton title="Loading Booking Mix…" />
                  ) : (
                    <InlineLock title="Booking Mix is locked" note="Requires bookings.read" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  {/* QuickLinks → keep open with dashboard.view (already satisfied) */}
                  <QuickLinks items={ql.links} loading={ql.loading} />
                </div>
                <div>
                  {/* AlertsPanel → require reports.view OR limited */}
                  {isAdmin(role) || hasAll(perms, ["reports.view"]) ? (
                    <AlertsPanel
                      invoicesDue={sum.data?.risks.invoicesDue}
                      licensesExpiring30d={sum.data?.risks.licensesExpiring30d}
                      lowStockItems={sum.data?.risks.lowStockItems}
                      loading={sum.loading}
                    />
                  ) : !permsReady ? (
                    <InlineSkeleton title="Loading Alerts…" />
                  ) : (
                    <InlineLock title="Alerts are limited" note="Some alerts require reports.view" />
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
