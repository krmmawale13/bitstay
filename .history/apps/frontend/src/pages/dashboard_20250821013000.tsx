// src/pages/dashboard.tsx
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // -------- Demo data (wire to backend later) --------
  const occupancy = 0.83; // 83%
  const targetOcc = 0.8;  // 80% target

  const revenue7d = useMemo(
    () => [
      { d: "Mon", amt: 35200 },
      { d: "Tue", amt: 41250 },
      { d: "Wed", amt: 38500 },
      { d: "Thu", amt: 43200 },
      { d: "Fri", amt: 45500 },
      { d: "Sat", amt: 51200 },
      { d: "Sun", amt: 47850 },
    ],
    []
  );

  const bookingsToday = 14;
  const openCheckins = 6;
  const openCheckouts = 8;

  // -------- Formatters --------
  const compactINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1, style: "currency", currency: "INR" }).format(n);

  const plainINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="flex h-screen text-slate-900 dark:text-slate-100 relative">
      {/* Subtle app background (kept same family but muted by content cards) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.22),transparent_60%)] mix-blend-soft-light" />

      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="p-6 space-y-6 overflow-y-auto">
          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg px-6 py-5"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  A clean overview of today’s key metrics and trends.
                </p>
              </div>
              {/* Quiet Quick Actions */}
              <div className="flex items-center gap-2">
                {["New Booking", "Check-in", "Check-out"].map((label) => (
                  <button
                    key={label}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium
                               bg-white/80 dark:bg-slate-800/80
                               border border-slate-200/60 dark:border-slate-700
                               hover:bg-white dark:hover:bg-slate-800 transition"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Occupancy gauge (professional, minimal) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="md:col-span-2 rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Occupancy</h2>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Target {Math.round(targetOcc * 100)}%
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                {/* Radial gauge */}
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="68%"
                      outerRadius="100%"
                      startAngle={220}
                      endAngle={-40}
                      data={[{ name: "Occ", value: Math.round(occupancy * 100) }]}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        tick={false}
                      />
                      {/* Background track */}
                      <RadialBar
                        dataKey={() => 100}
                        cornerRadius={20}
                        fill="#e5e7eb"
                        clockWise
                        opacity={0.6}
                      />
                      {/* Actual value */}
                      <RadialBar
                        dataKey="value"
                        cornerRadius={20}
                        fill="#3b82f6" // Tailwind blue-500
                        clockWise
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                {/* Center readout / deltas */}
                <div className="flex flex-col items-center sm:items-start gap-1">
                  <div className="text-4xl font-bold tracking-tight">
                    {Math.round(occupancy * 100)}%
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Rooms occupied today
                  </div>
                  <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                    ▲ +2% vs yesterday
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Last 7-day avg: 79%
                  </div>
                </div>
              </div>
            </motion.div>

            {/* KPI tiles (quiet, neutral) */}
            {[
              { title: "Bookings Today", value: bookingsToday.toString() },
              { title: "Open Check-ins", value: openCheckins.toString() },
              { title: "Open Check-outs", value: openCheckouts.toString() },
            ].map((k) => (
              <motion.div
                key={k.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg p-5"
              >
                <div className="text-sm text-slate-600 dark:text-slate-400">{k.title}</div>
                <div className="mt-2 text-3xl font-semibold">{k.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Revenue (last 7 days)</h2>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total: <span className="font-medium">{plainINR(revenue7d.reduce((a, b) => a + b.amt, 0))}</span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue7d} margin={{ top: 6, right: 10, left: 0, bottom: 2 }}>
                  <CartesianGrid strokeOpacity={0.25} vertical={false} />
                  <XAxis dataKey="d" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(v) => compactINR(v).replace("₹", "₹ ")}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <Tooltip
                    formatter={(val) => [plainINR(Number(val)), "Revenue"]}
                    labelFormatter={(l) => `Day: ${l}`}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  />
                  {/* target ref (average line) */}
                  <ReferenceLine
                    y={revenue7d.reduce((a, b) => a + b.amt, 0) / revenue7d.length}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                  />
                  <Bar dataKey="amt" radius={[6, 6, 0, 0]} fill="#64748b" /> {/* slate-500 */}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Quiet footer info / roadmap hint */}
          <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg p-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Next up: wire real data for occupancy trend, ADR/RevPAR, and booking funnel. This page is styled for
              enterprise CRM—minimal color, high contrast, compact data density.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
