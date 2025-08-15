import React from 'react';

export default function KpiCard({ label, value, footer }: { label: string; value: string|number; footer?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
      {footer && <div className="mt-2 text-xs text-slate-400">{footer}</div>}
    </div>
  );
}
