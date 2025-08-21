// src/pages/dashboard.tsx
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ---------------- DEMO DATA (replace with API later) ----------------
  // Cross-module KPIs
  const bookingsToday = 14;           // tbl_bookings (status=CONFIRMED, checkIn=today)
  const occupancyPct = 83;            // occupied rooms / total rooms (tbl_rooms + tbl_booking_rooms)
  const revenueToday = 45200;         // invoices + pos_orders for today
  const invoicesDue = 5;              // tbl_invoices status != PAID
  const licensesExpiring = 2;         // license + licenserenewalalert within N days
  const lowStockItems = 7;            // inventoryitems with qty<threshold (from stock registers/adjustments)

  // Revenue trend (last 7 days): rooms vs pos to avoid module repetition but still cross-module view
  const revenue7d = useMemo(
    () => [
      { d: "Mon", rooms: 22000, pos: 13200 },
      { d: "Tue", rooms: 24800, pos: 16450 },
      { d: "Wed", rooms: 21000, pos: 17500 },
      { d: "Thu", rooms: 26800, pos: 16400 },
      { d: "Fri", rooms: 28200, pos: 17300 },
      { d: "Sat", rooms: 31500, pos: 19700 },
      { d: "Sun", rooms: 29800, pos: 18050 },
    ],
    []
  );

  // Booking mix (today): confirmed / checked-in / checked-out / cancelled
  const bookingMix = useMemo(
    () => [
      { label: "Confirmed", value: 9 },
      { label: "Checked-In", value: 4 },
      { label: "Checked-Out", value: 1 },
      { label: "Cancelled", value: 0 },
    ],
    []
  );

  // Formatters
  const inr = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  const inrCompact = (n: number) =>
    new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1, style: "currency", currency: "INR" }).format(n);

  const totalRevenue7d = revenue7d.reduce((a, b) => a + b.rooms + b.pos, 0);

  return (
    <div className="flex h-screen text-slate-900 dark:text-slate-100 relative">
      {/* Background (muted gradient for brand consistency) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.22),transparent_60%)] mix-blend-soft-light" />

      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="p-6 space-y-6 overflow-y-auto">
          {/* Title Bar */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg px-6 py-5"
          >
            <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Cross-module overview — focused, professional, and non-repetitive.
            </p>
          </motion.div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KpiCard label="Bookings Today" value={bookingsToday.toString()} />
            <KpiCard label="Occupancy" value={`${occupancyPct}%`} />
            <KpiCard label="Revenue Today" value={inr(revenueToday)} />
            <KpiCard label="Invoices Due" value={invoicesDue.toString()} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Minimal Revenue Trend (Rooms vs POS) */}
            <ChartCard title="Revenue (last 7 days)" subtitle={`Total: ${inr(totalRevenue7d)}`} className="xl:col-span-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue7d} margin={{ top: 6, right: 12, left: -8, bottom: 2 }}>
                    <defs>
                      <linearGradient id="roomsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="posFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#64748b" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#64748b" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeOpacity={0.2} vertical={false} />
                    <XAxis dataKey="d" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => inrCompact(v).replace("₹", "₹ ")}
                      width={60}
                    />
                    <Tooltip
                      formatter={(val, n) => [inr(Number(val)), n === "rooms" ? "Rooms" : "POS"]}
                      labelFormatter={(l) => `Day: ${l}`}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    />
                    <Legend verticalAlign="top" height={24} wrapperStyle={{ opacity: 0.9 }} />
                    <Area type="monotone" dataKey="rooms" stroke="#3b82f6" strokeWidth={2} fill="url(#roomsFill)" />
                    <Area type="monotone" dataKey="pos" stroke="#64748b" strokeWidth={2} fill="url(#posFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Booking Status Mix (today) — clean bars, no kiddish palette */}
            <ChartCard title="Booking mix (today)">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingMix} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeOpacity={0.2} vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                    <Tooltip
                      formatter={(val) => [String(val), "Count"]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#334155" /> {/* slate-700 */}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Compliance & Alerts (schema-aligned, but not module pages dup) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SmallCard title="Compliance & Alerts">
              <ul className="text-sm space-y-2">
                <li className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Licenses expiring (30d)</span>
                  <span className="rounded-md px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    {licensesExpiring}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Low stock items</span>
                  <span className="rounded-md px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                    {lowStockItems}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Invoices due</span>
                  <span className="rounded-md px-2 py-0.5 bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                    {invoicesDue}
                  </span>
                </li>
              </ul>
            </SmallCard>

            <SmallCard title="Notes">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This dashboard avoids module repetition — deep module analytics (POS items, Room types, etc.) live on
                their own pages. Here we only show cross-module health and executive-level KPIs.
              </p>
            </SmallCard>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------- UI Partials (clean, reusable) ---------------- */

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg p-5"
    >
      <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
    </motion.div>
  );
}

function ChartCard({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg p-5 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <span className="text-xs text-slate-600 dark:text-slate-400">{subtitle}</span>}
      </div>
      {children}
    </motion.div>
  );
}

function SmallCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg p-5"
    >
      <h3 className="text-base font-semibold mb-3">{title}</h3>
      {children}
    </motion.div>
  );
}
