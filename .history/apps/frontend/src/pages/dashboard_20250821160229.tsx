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

import http from "@/lib/http";
import { toPermSet, can, canAll } from "@/lib/acl";

/** Small helper: load permissions from localStorage; if absent, try API */
function usePermissions() {
  const [perms, setPerms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const local = typeof window !== "undefined" ? localStorage.getItem("permissions") : null;
    if (local) {
      try {
        setPerms(toPermSet(JSON.parse(local)));
        setLoading(false);
        return;
      } catch {/* fallthrough */}
    }
    (async () => {
      try {
        const { data } = await http.get<{ permissions: string[] }>("/auth/permissions");
        const set = toPermSet(data?.permissions ?? []);
        setPerms(set);
        if (typeof window !== "undefined") {
          localStorage.setItem("permissions", JSON.stringify(Array.from(set)));
        }
      } catch {
        // if call fails, keep empty set -> no access UI
        setPerms(new Set());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { perms, loading };
}

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // permissions
  const { perms, loading: permsLoading } = usePermissions();

  // Gate booleans (page-level + sections)
  const canDashboard = can(perms, "dashboard.view");
  const canKPIs      = canDashboard; // all KPIs require dashboard.view
  const canRevenue   = canAll(perms, ["dashboard.view", "reports.view"]);
  const canBookings  = canAll(perms, ["dashboard.view", "bookings.read"]);
  const canInvoices  = canAll(perms, ["dashboard.view", "invoices.read"]);
  const canInventory = canAll(perms, ["dashboard.view", "inventory.read"]);
  const canQuick     = canDashboard; // quick links are generic; you can refine if needed

  // NOTE: Hooks still run; if you want to avoid API calls w/o permission,
  // add an 'enabled' option inside each hook and pass the above booleans.
  const sum = useDashboardSummary();
  const rev = useRevenue7d();
  const mix = useBookingMixToday();
  const ql  = useQuickLinks();

  const inr = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  // TODO: replace with API when /dashboard/properties is available
  const hotels: PropertyCard[] = [];

  // If perms still loading
  if (permsLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-900 dark:text-slate-100">
        <div className="px-4 py-2 rounded-xl border">Loading access…</div>
      </div>
    );
  }

  // If user has no access to dashboard at all
  if (!canDashboard) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-900 dark:text-slate-100">
        <div className="px-4 py-3 rounded-xl border bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
          You don’t have permission to view the dashboard.
        </div>
      </div>
    );
  }

  // Filter quick links by required permissions if your hook returns them with `required: string[]`
  const filteredQuickLinks = useMemo(() => {
    const items = ql.links ?? [];
    return items.filter((it: any) => {
      const req: string[] = Array.isArray(it?.required) ? it.required : [];
      return req.length ? req.every((key) => perms.has(key)) : true;
    });
  }, [ql.links, perms]);

  return (
    <div className="flex h-screen text-slate-900 dark:text-slate-100 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.22),transparent_60%)] mix-blend-soft-light" />

      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow px-6 py-5">
            <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tenant overview — today’s KPIs, trends and exceptions.
            </p>
          </div>

          {/* KPIs */}
          {canKPIs && (
            <KpiStrip
              bookingsToday={sum.data?.bookingsToday}
              occupancyPct={sum.data?.occupancyPct}
              revenueToday={sum.data ? inr(sum.data.revenueToday.total) : undefined}
              invoicesDue={sum.data?.risks.invoicesDue}
              loading={sum.loading}
            />
          )}

          {/* Optional Properties strip */}
          {canKPIs && hotels.length > 0 && <PropertiesStrip hotels={hotels} />}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Revenue Trend */}
            {canRevenue && (
              <div className="xl:col-span-2">
                <RevenueTrend data={rev.data} loading={rev.loading} />
              </div>
            )}
            {/* Booking Mix */}
            {canBookings && (
              <div>
                <BookingMixToday data={mix.data} loading={mix.loading} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Links */}
            {canQuick && (
              <div className="md:col-span-2">
                <QuickLinks items={filteredQuickLinks} loading={ql.loading} />
              </div>
            )}

            {/* Alerts */}
            {(canInvoices || canInventory) && (
              <div>
                <AlertsPanel
                  invoicesDue={canInvoices ? sum.data?.risks.invoicesDue : undefined}
                  licensesExpiring30d={sum.data?.risks.licensesExpiring30d /* keep generic */}
                  lowStockItems={canInventory ? sum.data?.risks.lowStockItems : undefined}
                  loading={sum.loading}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
