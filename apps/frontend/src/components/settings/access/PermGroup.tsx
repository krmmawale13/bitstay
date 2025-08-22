import React, { useState } from "react";

export default function PermGroup({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState<boolean>(defaultOpen);

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50/60 dark:bg-slate-800/60"
        aria-expanded={open}
      >
        <div className="text-sm font-medium">{title}</div>
        <div
          className={`transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        >
          ▸
        </div>
      </button>
      {open && (
        <div className="p-3 bg-white/70 dark:bg-slate-900/40">{children}</div>
      )}
    </section>
  );
}
