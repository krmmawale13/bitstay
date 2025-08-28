import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, X, User } from "lucide-react";
import { useRouter } from "next/router";
import { searchCustomers, quickCreateCustomer, type Customer } from "@/services/customers.service";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/** Non-breaking toast (uses window.__toast if present) */
function toast(type: "success"|"error"|"info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  if (api?.push) api.push({ type, message, description });
  else console.log(`[toast:${type}]`, message, description ?? "");
}

export default function CustomerPicker({
  value,
  onChange,
  label = "Customer",
  placeholder = "Search name, phone, email…",
  required = true,
  allowQuickAdd = true,
  autoFocus = false,
}: {
  value?: number | null;
  onChange: (id: number | null, customer?: Customer) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  allowQuickAdd?: boolean;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // focus
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // when value changes from outside, clear selection text (optional)
  useEffect(() => {
    if (!value) {
      setSelected(null);
      setQuery("");
    }
  }, [value]);

  // debounced search
  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (!query.trim()) { setItems([]); return; }
      try {
        setBusy(true);
        const results = await searchCustomers(query.trim(), 10);
        if (!active) return;
        setItems(results || []);
      } catch (e: any) {
        setItems([]);
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(t); };
  }, [query]);

  const selectCustomer = (c: Customer) => {
    setSelected(c);
    setQuery("");
    setItems([]);
    setOpen(false);
    onChange(c.id, c);
  };

  const clearSelection = () => {
    setSelected(null);
    setQuery("");
    onChange(null);
  };

  // quick add minimal modal state
  const [qaOpen, setQaOpen] = useState(false);
  const [qaName, setQaName] = useState("");
  const [qaPhone, setQaPhone] = useState("");
  const [qaSaving, setQaSaving] = useState(false);

  const doQuickAdd = async () => {
    const name = qaName.trim();
    if (!name) { toast("error", "Name is required"); return; }
    try {
      setQaSaving(true);
      const created = await quickCreateCustomer({ name, phone: qaPhone.trim() || undefined });
      toast("success", "Customer created");
      setQaOpen(false);
      setQaName(""); setQaPhone("");
      if (created?.id) {
        onChange(created.id, created as any);
        setSelected(created as any);
      }
    } catch (e: any) {
      toast("error", "Quick add failed", e?.response?.data?.message || e?.message);
    } finally {
      setQaSaving(false);
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}{required ? " *" : ""}</label>

      {/* selected pill OR input */}
      {selected ? (
        <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs">
              {selected.name?.slice(0,1).toUpperCase() || "C"}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{selected.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{selected.phone ?? "—"} {selected.email ? `• ${selected.email}` : ""}</div>
            </div>
          </div>
          <button type="button" onClick={clearSelection} className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="mt-1 relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e)=>{ setQuery(e.target.value); setOpen(true); }}
            onFocus={()=> setOpen(true)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      )}

      {/* dropdown */}
      {open && !selected && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg max-h-72 overflow-auto">
          {busy && <div className="px-3 py-2 text-sm text-slate-500">Searching…</div>}
          {!busy && items.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
          )}
          {!busy && items.map((c) => (
            <button
              type="button"
              key={c.id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
              onClick={() => selectCustomer(c)}
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[10px]">
                {c.name?.slice(0,1).toUpperCase() || "C"}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{c.phone ?? "—"} {c.email ? `• ${c.email}` : ""}</div>
              </div>
              <span className="ml-auto text-[11px] text-slate-400">#{c.id}</span>
            </button>
          ))}

          {allowQuickAdd && (
            <>
              <div className="border-t border-slate-200 dark:border-slate-800 my-1" />
              <button
                type="button"
                className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => { setQaOpen(true); setOpen(false); }}
              >
                <Plus size={16} />
                Quick add customer…
              </button>
            </>
          )}
        </div>
      )}

      {/* Quick Add Modal */}
      {qaOpen && (
        <Modal title="Quick add customer" onClose={() => setQaOpen(false)}>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Name *</label>
              <input
                value={qaName}
                onChange={(e)=>setQaName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Phone</label>
              <input
                value={qaPhone}
                onChange={(e)=>setQaPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Optional"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setQaOpen(false)} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={doQuickAdd} disabled={qaSaving} className="rounded-lg px-3 py-1.5 text-sm text-white shadow-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-60">
                {qaSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* Lightweight Modal (copy styling from your customer dashboard) */
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div ref={ref} className="relative z-[101] w-full max-w-md rounded-2xl border border-white/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/20 dark:border-slate-800">
          <div className="text-sm font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10">Close</button>
        </div>
        <div className="max-h-[80vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}
