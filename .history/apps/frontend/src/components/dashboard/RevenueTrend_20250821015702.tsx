import React from "react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import type { Revenue7d } from "@/hooks/useRevenue7d";

const inrCompact = (n: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1, style: "currency", currency: "INR" }).format(n);

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function RevenueTrend({ data, loading }: { data?: Revenue7d | null; loading?: boolean }) {
  if (loading) {
    return <div className="h-72 rounded-2xl border border-white/20 bg-white/70 dark:bg-slate-900/60 animate-pulse" />;
  }
  const series = data?.days ?? [];
  const total = series.reduce((a, b) => a + b.rooms + b.pos, 0);

  return (
    <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Revenue (last 7 days)</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Total: {inr(total)}</span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 6, right: 12, left: -8, bottom: 2 }}>
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
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={(v) => inrCompact(v).replace("₹", "₹ ")} />
            <Tooltip
              formatter={(val, n) => [inr(Number(val)), n === "rooms" ? "Rooms" : "POS"]}
              labelFormatter={(l) => `Date: ${l}`}
              contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)" }}
            />
            <Legend verticalAlign="top" height={24} wrapperStyle={{ opacity: 0.9 }} />
            <Area type="monotone" dataKey="rooms" stroke="#3b82f6" strokeWidth={2} fill="url(#roomsFill)" />
            <Area type="monotone" dataKey="pos" stroke="#64748b" strokeWidth={2} fill="url(#posFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
