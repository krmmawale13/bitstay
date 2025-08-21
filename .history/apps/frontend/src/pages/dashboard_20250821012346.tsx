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
} from "recharts";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ---- demo data (no backend yet) ----
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

  const occ14d = useMemo(
    () => [
      { d: "D-13", pct: 62 },
      { d: "D-12", pct: 64 },
      { d: "D-11", pct: 66 },
      { d: "D-10", pct: 69 },
      { d: "D-9", pct: 71 },
      { d: "D-8", pct: 70 },
      { d: "D-7", pct: 72 },
      { d: "D-6", pct: 75 },
      { d: "D-5", pct: 77 },
      { d: "D-4", pct: 79 },
      { d: "D-3", pct: 80 },
      { d: "D-2", pct: 82 },
      { d: "D-1", pct: 81 },
      { d: "Today", pct: 83 },
    ],
    []
  );

  return (
    <div className="flex h-screen text-gray-800 dark:text-gray-100 transition-colors duration-500 relative">
      {/* global gradient bg to match login/topbar/sidebar */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.25),transparent_60%)] mix-blend-soft-light" />

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg p-6"
          >
            <h1 className="text-2xl font-semibold text-white drop-shadow-sm">
              Welcome to BitStay
            </h1>
            <p className="mt-1 text-white/90">
              Your one-stop hospitality dashboard. High-level KPIs and quick actions at a glance.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Bookings Today",
                value: "14",
                gradient: "from-cyan-400 to-sky-500",
              },
              {
                title: "Occupancy Rate",
                value: "83%",
                gradient: "from-indigo-400 to-fuchsia-500",
              },
              {
                title: "Revenue",
                value: "₹45,200",
                gradient: "from-rose-400 to-orange-400",
              },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                whileHover={{ scale: 1.02 }}
                className={`rounded-2xl p-6 shadow-lg text-white bg-gradient-to-r ${s.gradient}`}
              >
                <div className="text-sm/5 opacity-90">{s.title}</div>
                <div className="mt-2 text-3xl font-bold">{s.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Occupancy trend (Area) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="xl:col-span-2 rounded-2xl border border-white/20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Occupancy (last 14 days)</h2>
                <span className="text-xs text-white/80">Target: 80%</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={occ14d} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="occ" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeOpacity={0.2} />
                    <XAxis dataKey="d" />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="pct"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      fill="url(#occ)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Revenue (Bar) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-white/20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Revenue (last 7 days)</h2>
                <span className="text-xs text-white/80">INR</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue7d} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeOpacity={0.2} />
                    <XAxis dataKey="d" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amt" fill="#a78bfa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions (readable in light mode) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                "New Booking",
                "Check-in",
                "Check-out",
                "Inventory",
                "POS / Bar",
                "Reports",
                "Settings",
                "Customers",
              ].map((action, i) => (
                <motion.button
                  key={action}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl px-4 py-3 font-medium shadow-sm transition
                             text-white bg-gradient-to-r from-sky-600 to-indigo-600
                             hover:from-sky-500 hover:to-indigo-500
                             dark:from-sky-500 dark:to-indigo-500"
                >
                  {action}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
