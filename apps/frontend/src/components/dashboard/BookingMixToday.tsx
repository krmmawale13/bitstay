import React from "react";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import type { BookingMixRow } from "@/hooks/useBookingMixToday";

export default function BookingMixToday({ data, loading }: { data?: BookingMixRow[] | null; loading?: boolean }) {
  if (loading) {
    return <div className="h-72 rounded-2xl border border-white/20 bg-white/70 dark:bg-slate-900/60 animate-pulse" />;
  }
  const rows = (data ?? []).map((r) => ({ label: toLabel(r.status), value: r.count }));

  return (
    <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Booking mix (today)</h3>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid strokeOpacity={0.2} vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)" }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#334155" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function toLabel(s: BookingMixRow["status"]) {
  switch (s) {
    case "PENDING": return "Pending";
    case "CONFIRMED": return "Confirmed";
    case "CHECKED_IN": return "Checked-In";
    case "CHECKED_OUT": return "Checked-Out";
    case "CANCELLED": return "Cancelled";
    default: return s;
  }
}
