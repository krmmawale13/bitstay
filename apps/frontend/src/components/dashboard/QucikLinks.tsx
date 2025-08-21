import React from "react";
import Link from "next/link";

export default function QuickLinks({
  items,
  loading,
}: {
  items: Array<{ href: string; label: string; badge?: number }>;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-5">
        <div className="mb-3 h-5 w-32 rounded bg-slate-200/70 dark:bg-slate-700/60 animate-pulse" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-32 rounded-xl bg-slate-200/70 dark:bg-slate-700/60 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const Pill = ({
    href,
    label,
    badge,
  }: {
    href: string;
    label: string;
    badge?: number;
  }) => (
    <Link
      href={href}
      aria-label={label}
      className="
        group inline-flex items-center gap-2 rounded-xl px-3.5 py-2
        text-sm font-medium
        bg-gradient-to-b from-white to-slate-50
        dark:from-slate-800 dark:to-slate-900
        border border-slate-200/80 dark:border-slate-700
        shadow-[0_1px_0_rgba(0,0,0,0.04),_0_1px_2px_rgba(0,0,0,0.06)]
        hover:shadow-[0_6px_14px_rgba(0,0,0,0.10)]
        hover:-translate-y-0.5 active:translate-y-0
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60
      "
    >
      <span className="text-slate-700 dark:text-slate-200">{label}</span>
      {typeof badge === "number" && (
        <span
          className="
            ml-0.5 inline-flex min-w-[1.5rem] justify-center rounded-lg px-1.5 py-0.5
            text-[10px] font-semibold
            bg-gradient-to-b from-slate-100 to-slate-200 text-slate-700
            dark:from-slate-700 dark:to-slate-800 dark:text-slate-200
            border border-slate-300/80 dark:border-slate-600
            shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]
            group-hover:from-slate-50 group-hover:to-slate-150
          "
          title={`${badge} items`}
        >
          {badge}
        </span>
      )}
    </Link>
  );

  return (
    <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Quick Links
        </h3>
        {/* optional hint */}
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Shortcuts for daily ops
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          No actions available right now.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <Pill
              key={it.href + it.label}
              href={it.href}
              label={it.label}
              badge={it.badge}
            />
          ))}
        </div>
      )}
    </div>
  );
}
