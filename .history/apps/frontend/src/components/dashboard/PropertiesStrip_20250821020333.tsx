import React from "react";

export type PropertyCard = {
  id: number;
  name: string;
  occupancyPct: number;
  adr?: number | null;
  revenueToday?: number | null;
};

export default function PropertiesStrip({
  hotels,
  loading,
}: {
  hotels: PropertyCard[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-white/20 bg-white/70 dark:bg-slate-900/60 animate-pulse" />
        ))}
      </div>
    );
  }

  const inr = (n?: number | null) =>
    typeof n === "number"
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
      : "—";

  return (
    <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Properties</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hotels.map((h) => (
          <div
            key={h.id}
            className="rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
          >
            <div className="text-sm font-semibold">{h.name}</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <div className="text-slate-500">Occ</div>
                <div className="text-slate-900 dark:text-slate-100 font-semibold">{h.occupancyPct}%</div>
              </div>
              <div>
                <div className="text-slate-500">ADR</div>
                <div className="text-slate-900 dark:text-slate-100 font-semibold">{inr(h.adr)}</div>
              </div>
              <div>
                <div className="text-slate-500">Revenue</div>
                <div className="text-slate-900 dark:text-slate-100 font-semibold">{inr(h.revenueToday)}</div>
              </div>
            </div>
          </div>
        ))}
        {hotels.length === 0 && (
          <div className="col-span-full text-sm text-slate-500 dark:text-slate-400">
            No properties to show.
          </div>
        )}
      </div>
    </div>
  );
}
