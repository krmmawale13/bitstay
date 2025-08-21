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
    return <div className="h-32 rounded-2xl border border-white/20 bg-white/70 dark:bg-slate-900/60 animate-pulse" />;
  }

  const Pill = ({ href, label, badge }: { href: string; label: string; badge?: number }) => (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition"
    >
      <span className="text-sm">{label}</span>
      {typeof badge === "number" && (
        <span className="text-xs rounded-md bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5">{badge}</span>
      )}
    </Link>
  );

  return (
    <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-5">
      <h3 className="text-base font-semibold mb-3">Quick Links</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <Pill key={it.href + it.label} href={it.href} label={it.label} badge={it.badge} />
        ))}
      </div>
    </div>
  );
}
