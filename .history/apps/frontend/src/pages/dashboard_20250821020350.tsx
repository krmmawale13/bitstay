import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

import KpiStrip from "@/components/dashboard/KpiStrip";
import RevenueTrend from "@/components/dashboard/RevenueTrend";
import BookingMixToday from "@/components/dashboard/BookingMixToday";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import QuickLinks from "@/components/dashboard/QuickLinks";
import PropertiesStrip, { type PropertyCard } from "@/components/dashboard/PropertiesStrip";

import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { useRevenue7d } from "@/hooks/useRevenue7d";
import { useBookingMixToday } from "@/hooks/useBookingMixToday";
import { useQuickLinks } from "@/hooks/useQuickLinks";

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
        </main>
      </div>
    </div>
  );
}
