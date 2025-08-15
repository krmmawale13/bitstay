// apps/frontend/src/components/KpiCard.tsx
import React from "react";

export type KpiCardProps = {
  label: string;
  value: string | number;
  footer?: string;
};

export default function KpiCard({ label, value, footer }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {footer && <div className="mt-2 text-xs text-slate-400">{footer}</div>}
    </div>
  );
}
