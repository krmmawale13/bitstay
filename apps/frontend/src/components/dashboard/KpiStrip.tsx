import React from "react";

export default function KpiStrip({
  bookingsToday,
  occupancyPct,
  revenueToday,
  invoicesDue,
  loading,
}: {
  bookingsToday?: number;
  occupancyPct?: number;
  revenueToday?: string;
  invoicesDue?: number;
  loading?: boolean;
}) {
  const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-4">
      <div className="text-xs text-slate-600 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[76px] rounded-2xl border border-white/20 bg-white/60 dark:bg-slate-900/60 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Item label="Bookings Today" value={bookingsToday ?? "—"} />
      <Item label="Occupancy" value={occupancyPct != null ? `${occupancyPct}%` : "—"} />
      <Item label="Revenue Today" value={revenueToday ?? "—"} />
      <Item label="Invoices Due" value={invoicesDue ?? "—"} />
    </div>
  );
}
