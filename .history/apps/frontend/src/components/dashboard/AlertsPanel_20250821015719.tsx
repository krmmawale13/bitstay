import React from "react";

export default function AlertsPanel({
  invoicesDue,
  licensesExpiring30d,
  lowStockItems,
  loading,
}: {
  invoicesDue?: number;
  licensesExpiring30d?: number;
  lowStockItems?: number;
  loading?: boolean;
}) {
  if (loading) {
    return <div className="h-40 rounded-2xl border border-white/20 bg-white/70 dark:bg-slate-900/60 animate-pulse" />;
  }
  const Row = ({ label, val, tone }: { label: string; val: number | undefined; tone: "rose" | "amber" | "sky" }) => {
    const toneMap = {
      rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
      amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    } as const;
    return (
      <li className="flex items-center justify-between">
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
        <span className={`rounded-md px-2 py-0.5 text-xs ${toneMap[tone]}`}>{val ?? 0}</span>
      </li>
    );
  };

  return (
    <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-5">
      <h3 className="text-base font-semibold mb-3">Compliance & Alerts</h3>
      <ul className="space-y-2">
        <Row label="Invoices due" val={invoicesDue} tone="sky" />
        <Row label="Licenses expiring (30d)" val={licensesExpiring30d} tone="amber" />
        <Row label="Low stock items" val={lowStockItems} tone="rose" />
      </ul>
    </div>
  );
}
