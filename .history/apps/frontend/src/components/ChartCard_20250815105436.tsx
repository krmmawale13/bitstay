// apps/frontend/src/components/ChartCard.tsx
import React from "react";

export function ChartCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500 mb-3">{title}</div>
      <svg viewBox="0 0 400 140" className="w-full h-32">
        <defs>
          <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d="M0,120 C40,80 80,90 120,60 C160,40 200,70 240,50 C280,35 320,55 360,40 L400,40 L400,140 L0,140 Z" fill="url(#g1)" />
        <polyline points="0,120 40,80 80,90 120,60 160,40 200,70 240,50 280,35 320,55 360,40" fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
