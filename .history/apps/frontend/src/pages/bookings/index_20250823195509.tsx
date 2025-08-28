import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MainLayout from "@/layouts/MainLayout";
import bookingsService from "@/services/bookings.service";
import {
  CalendarDays,
  Plus,
  Search,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";

/* ---------------- helpers ---------------- */
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function fmtDateShort(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
function exportCsv(rows: any[]) {
  const head = ["ID", "Customer", "CheckIn", "CheckOut", "Status", "Rooms", "Source"];
  const lines = rows.map((r) => [
    r.id,
    r.customer?.name ?? "",
    r.checkIn ?? "",
    r.checkOut ?? "",
    r.status ?? "",
    (r.rooms ?? []).map((x: any) => (x?.room?.number ? `#${x.room.number}` : x?.roomId ?? "")).join(" | "),
    r.source?.name ?? "",
  ]);
  const csv = [head, ...lines]
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookings.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- status chip ---------------- */
function StatusChip({ status }: { status: string }) {
  const map: Record<string, { text: string; ring: string; bg: string; fg: string }> = {
    PENDING: {
      text: "Pending",
      ring: "ring-amber-200 dark:ring-amber-800",
      bg: "bg-amber-50 dark:bg-amber-900/30",
      fg: "text-amber-700 dark:text-amber-200",
    },
    CONFIRMED: {
      text: "Confirmed",
      ring: "ring-blue-200 dark:ring-blue-800",
      bg: "bg-blue-50 dark:bg-blue-900/30",
      fg: "text-blue-700 dark:text-blue-200",
    },
    CHECKED_IN: {
      text: "Checked-in",
      ring: "ring-emerald-200 dark:ring-emerald-800",
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      fg: "text-emerald-700 dark:text-emerald-200",
    },
    CHECKED_OUT: {
      text: "Checked-out",
      ring: "ring-slate-200 dark:ring-slate-700",
      bg: "bg-slate-50 dark:bg-slate-800",
      fg: "text-slate-700 dark:text-slate-300",
    },
    CANCELLED: {
      text: "Cancelled",
      ring: "ring-rose-200 dark:ring-rose-800",
      bg: "bg-rose-50 dark:bg-rose-900/30",
      fg: "text-rose-700 dark:text-rose-200",
    },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className={cls("inline-flex items-center rounded-full px-2.5 py-1 text-xs ring-1", s.bg, s.fg, s.ring)}>
      {s.text}
    </span>
  );
}

/* ---------------- tiny SVG charts (no deps) ---------------- */
function DonutStatus({
  data,
  onSliceClick,
}: {
  data: { key: string; value: number; label: string }[];
  onSliceClick?: (key: string) => void;
}) {
  const total = Math.max(0, data.reduce((s, d) => s + d.value, 0));
  const R = 40;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const palette: Record<string, string> = {
    PENDING: "#f59e0b",
    CONFIRMED: "#2563eb",
    CHECKED_IN: "#059669",
    CHECKED_OUT: "#475569",
    CANCELLED: "#e11d48",
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] items-center gap-4">
      <div className="relative mx-auto">
        <div
          className="absolute inset-0 blur-xl rounded-full opacity-40"
          style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.15), transparent 70%)" }}
        />
        <svg viewBox="0 0 100 100" className="h-28 w-28 relative" role="img" aria-label="Bookings status distribution">
          <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="12" />
          {data.map((d, i) => {
            const frac = total ? d.value / total : 0;
            const len = Math.max(0, frac * C);
            const dash = `${len} ${C - len}`;
            const offset = -(acc / Math.max(total, 1)) * C;
            acc += d.value;
            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={palette[d.key] || "#64748b"}
                strokeWidth="12"
                strokeDasharray={dash}
                strokeDashoffset={offset}
                style={{ cursor: onSliceClick ? "pointer" : "default", transition: "stroke-dasharray 300ms, transform 200ms, stroke-width 150ms" }}
                className="hover:stroke-[14] active:scale-[1.02]"
                onClick={() => onSliceClick?.(d.key)}
              />
            );
          })}
          <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="fill-slate-700 dark:fill-slate-200 text-xs">
            {total} total
          </text>
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-1">
        {data.map((d) => (
          <button
            key={d.key}
            onClick={() => onSliceClick?.(d.key)}
            className="flex items-center gap-2 text-xs text-left rounded-lg px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"
            title={`Filter: ${d.label}`}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900"
              style={{
                background:
                  ({ PENDING: "#f59e0b", CONFIRMED: "#2563eb", CHECKED_IN: "#059669", CHECKED_OUT: "#475569", CANCELLED: "#e11d48" } as any)[d.key],
              }}
            />
            <span className="truncate">{d.label}</span>
            <span className="ml-auto font-medium tabular-nums">{d.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ points, height = 56, stroke = "currentColor" }: { points: number[]; height?: number; stroke?: string }) {
  const n = points.length;
  const max = Math.max(1, ...points);
  const w = Math.max(60, n * 8);
  const step = w / Math.max(1, n - 1);
  const d = points
    .map((y, i) => {
      const px = i * step;
      const py = height - (y / max) * (height - 6) - 3;
      return `${i === 0 ? "M" : "L"}${px},${py}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-14">
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

/* ---------- Date helpers ---------- */
function ymd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startOfDayISO(localYmd: string) {
  if (!localYmd) return "";
  return `${localYmd}T00:00`;
}
function endOfDayISO(localYmd: string) {
  if (!localYmd) return "";
  return `${localYmd}T23:59`;
}

/* ---------- Date Range Bar (no libs, date-only) ---------- */
function DateRangeBar({
  from,
  to,
  setFrom,
  setTo,
  onApply,
  onReset,
}: {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const today = useMemo(() => ymd(new Date()), []);
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return ymd(d);
  }, []);
  const last7 = () => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return ymd(d);
  };
  const thisMonth = () => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { from: ymd(start), to: ymd(end) };
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-2">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={from ? from.slice(0, 10) : ""}
          onChange={(e) => setFrom(startOfDayISO(e.target.value))}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          title="From"
        />
        <span className="text-slate-400">→</span>
        <input
          type="date"
          value={to ? to.slice(0, 10) : ""}
          onChange={(e) => setTo(endOfDayISO(e.target.value))}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          title="To"
        />
      </div>

      <div className="flex items-center gap-1 ml-1">
        <button
          onClick={() => {
            setFrom(startOfDayISO(today));
            setTo(endOfDayISO(today));
            onApply();
          }}
          className="rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700"
        >
          Today
        </button>
        <button
          onClick={() => {
            setFrom(startOfDayISO(tomorrow));
            setTo(endOfDayISO(tomorrow));
            onApply();
          }}
          className="rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700"
        >
          Tomorrow
        </button>
        <button
          onClick={() => {
            setFrom(startOfDayISO(last7()));
            setTo(endOfDayISO(today));
            onApply();
          }}
          className="rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700"
        >
          Last 7 days
        </button>
        <button
          onClick={() => {
            const m = thisMonth();
            setFrom(startOfDayISO(m.from));
            setTo(endOfDayISO(m.to));
            onApply();
          }}
          className="rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700"
        >
          This month
        </button>
        <button
          onClick={() => {
            setFrom("");
            setTo("");
            onReset();
          }}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <RefreshCcw size={14} />
          Clear
        </button>
      </div>
    </div>
  );
}

/* ---------------- color helpers for KPI cards ---------------- */
const kpiColor = (key: string) => {
  switch (key) {
    case "PENDING":
      return { from: "from-amber-500/15", to: "to-amber-500/5", ring: "ring-amber-400/40" };
    case "CONFIRMED":
      return { from: "from-blue-600/15", to: "to-indigo-600/5", ring: "ring-blue-500/40" };
    case "CHECKED_IN":
      return { from: "from-emerald-600/15", to: "to-emerald-600/5", ring: "ring-emerald-500/40" };
    case "CHECKED_OUT":
      return { from: "from-slate-600/15", to: "to-slate-600/5", ring: "ring-slate-500/40" };
    case "CANCELLED":
      return { from: "from-rose-600/15", to: "to-rose-600/5", ring: "ring-rose-500/40" };
    default:
      return { from: "from-slate-500/10", to: "to-slate-500/5", ring: "ring-slate-400/30" };
  }
};

/* ---------------- page ---------------- */
export default function BookingsIndexPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sources, setSources] = useState<Array<{ id: number; name: string }>>([]);
  const [summary, setSummary] = useState<any>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // search focus shortcut
  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const m = await bookingsService.getMeta();
      setSources(m?.sources ?? []);
      const s = await bookingsService.summary(from && to ? { from, to } : undefined);
      if (s) setSummary(s);
      const res = await bookingsService.list({
        status: status || undefined,
        sourceId: sourceId ? Number(sourceId) : undefined,
        from: from || undefined,
        to: to || undefined,
        skip: 0,
        take: 1000,
      } as any);
      setRows(Array.isArray(res?.items) ? res.items : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load bookings");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const text = `${r.id} ${r.customer?.name ?? ""} ${r.source?.name ?? ""} ${(r.rooms ?? [])
        .map((x: any) => x?.room?.number ?? "")
        .join(" ")}`.toLowerCase();
      return text.includes(s);
    });
  }, [rows, q]);

  const sparkPoints = useMemo(() => {
    const days = 30;
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));
    const counts = new Array(days).fill(0);
    for (const r of rows) {
      const d = new Date(r.checkIn);
      if (Number.isNaN(d.getTime())) continue;
      if (d < start || d > today) continue;
      const idx = Math.floor((d.getTime() - start.getTime()) / 86400000);
      if (idx >= 0 && idx < days) counts[idx] += 1;
    }
    return counts;
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  const donutData = useMemo(
    () => [
      { key: "PENDING", label: "Pending", value: summary?.PENDING ?? 0 },
      { key: "CONFIRMED", label: "Confirmed", value: summary?.CONFIRMED ?? 0 },
      { key: "CHECKED_IN", label: "Checked-in", value: summary?.CHECKED_IN ?? 0 },
      { key: "CHECKED_OUT", label: "Checked-out", value: summary?.CHECKED_OUT ?? 0 },
      { key: "CANCELLED", label: "Cancelled", value: summary?.CANCELLED ?? 0 },
    ],
    [summary]
  );

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <CalendarDays size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filtered.length} of {rows.length} records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCsv(filtered)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-200
                         bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
              title="Export CSV"
            >
              <Download size={16} />
              Export
            </button>
            <Link
              href="/bookings/create"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                         shadow-sm active:scale-[0.98]"
            >
              <Plus size={16} />
              New
            </Link>
          </div>
        </div>

        {/* KPI + Donut row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* KPI cards */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: "", label: "Total", value: summary?.total ?? 0, hint: "All statuses" },
              { key: "PENDING", label: "Pending", value: summary?.PENDING ?? 0, hint: "Awaiting confirmation" },
              { key: "CONFIRMED", label: "Confirmed", value: summary?.CONFIRMED ?? 0, hint: "Ready to check-in" },
              { key: "CHECKED_IN", label: "Checked-in", value: summary?.CHECKED_IN ?? 0, hint: "Currently staying" },
              { key: "CHECKED_OUT", label: "Checked-out", value: summary?.CHECKED_OUT ?? 0, hint: "Completed" },
              { key: "CANCELLED", label: "Cancelled", value: summary?.CANCELLED ?? 0, hint: "Void / cancelled" },
            ].map((k) => {
              const c = kpiColor(k.key);
              return (
                <button
                  key={k.label}
                  onClick={() => {
                    setStatus(k.key); setPage(1); loadAll();
                  }}
                  className={cls(
                    "group relative overflow-hidden text-left rounded-xl border p-3 transition shadow-sm",
                    "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:shadow",
                    "ring-1 ring-transparent hover:scale-[1.01]",
                    c.ring
                  )}
                  title={k.hint}
                >
                  <div className={cls("pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br", c.from, c.to, "opacity-80")} />
                  <div className="pointer-events-none absolute -top-1/2 left-0 h-full w-full translate-y-0 bg-white/10 blur-xl transition-transform duration-500 group-hover:translate-y-1/2" />
                  <div className="relative">
                    <div className="text-xs text-slate-500">{k.label}</div>
                    <div className="mt-1 text-2xl font-semibold">{k.value}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{k.hint}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Donut card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Status mix</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Tap a slice/legend to filter</div>
              </div>
            </div>
            <div className="mt-2">
              <DonutStatus
                data={donutData}
                onSliceClick={(key) => {
                  setStatus(
                    key === "CHECKED_OUT" || key === "CANCELLED" || key === "PENDING" || key === "CONFIRMED" || key === "CHECKED_IN"
                      ? key
                      : ""
                  );
                  setPage(1);
                  loadAll();
                }}
              />
            </div>
          </div>
        </div>

        {/* Sparkline row */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Check-ins (last 30 days)</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Trend of arrivals</div>
            </div>
          </div>
          <div className="mt-2 text-blue-600 dark:text-blue-400">
            <Sparkline points={sparkPoints} />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search booking #, customer, room…  ( / )"
              className="w-60 sm:w-72 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-blue-300"
            />
            <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            title="Status"
          >
            <option value="">Status: All</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked-in</option>
            <option value="CHECKED_OUT">Checked-out</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Source */}
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            title="Source"
          >
            <option value="">Source: All</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* New: Date range bar (date-only, with presets) */}
          <DateRangeBar
            from={from}
            to={to}
            setFrom={setFrom}
            setTo={setTo}
            onApply={() => { setPage(1); loadAll(); }}
            onReset={() => { setQ(""); setStatus(""); setSourceId(""); setPage(1); loadAll(); }}
          />
        </div>

        {/* Error alert */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
            <div className="font-semibold">Couldn’t load bookings</div>
            <div className="opacity-80">{error}</div>
            <button
              onClick={loadAll}
              className="mt-2 inline-flex items-center rounded-lg px-3 py-1 text-white bg-rose-600 hover:bg-rose-500"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
          {loading ? (
            <div className="p-6 animate-pulse space-y-3">
              <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-10 w-56 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-64 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No bookings found.</div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                    <tr>
                      <Th>#</Th>
                      <Th>Customer</Th>
                      <Th>Dates</Th>
                      <Th>Rooms</Th>
                      <Th>Status</Th>
                      <Th>Due</Th>
                      <Th className="text-center">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {paged.map((b) => {
                      const charges = (b.bookingcharge ?? []) as any[];
                      const payments = (b.payments ?? []) as any[];
                      const chargesTotal = charges.reduce((s, c) => s + Number(c.amount || 0) + Number(c.taxAmount || 0), 0);
                      const paymentsTotal = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
                      const balance = Math.round((chargesTotal - paymentsTotal) * 100) / 100;
                      const dueClass =
                        balance > 0
                          ? "text-rose-700 bg-rose-50 ring-rose-200 dark:text-rose-200 dark:bg-rose-900/30 dark:ring-rose-800"
                          : balance < 0
                          ? "text-indigo-700 bg-indigo-50 ring-indigo-200 dark:text-indigo-200 dark:bg-indigo-900/30 dark:ring-indigo-800"
                          : "text-emerald-700 bg-emerald-50 ring-emerald-200 dark:text-emerald-200 dark:bg-emerald-900/30 dark:ring-emerald-800";

                      return (
                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                          <Td>#{b.id}</Td>
                          <Td className="font-medium">{b.customer?.name || "—"}</Td>
                          <Td>
                            <div className="flex flex-col">
                              <span>{fmtDateShort(b.checkIn)}</span>
                              <span className="text-xs text-slate-500">{fmtDateShort(b.checkOut)}</span>
                            </div>
                          </Td>
                          <Td>
                            {(b.rooms ?? []).length ? (
                              <div className="flex flex-wrap gap-1">
                                {(b.rooms ?? []).map((x: any) => (
                                  <span
                                    key={`${b.id}-${x.room?.id ?? x.id}`}
                                    className="inline-flex items-center rounded-md bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-xs ring-1 ring-slate-200 dark:ring-slate-700"
                                  >
                                    #{x.room?.number ?? x.roomId}
                                  </span>
                                ))}
                              </div>
                            ) : "—"}
                          </Td>
                          <Td><StatusChip status={b.status} /></Td>
                          <Td>
                            <span className={cls("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1", dueClass)}>
                              {balance > 0 ? `Due ₹${balance}` : balance < 0 ? `Overpaid ₹${Math.abs(balance)}` : "Settled"}
                            </span>
                          </Td>
                          <Td className="text-center">
                            <Link
                              href={`/bookings/${b.id}`}
                              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white
                                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                            >
                              <Eye size={16} /> View
                            </Link>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-sm">
                <div>
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong> • Showing{" "}
                  <strong>{(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)}</strong> of{" "}
                  <strong>{filtered.length}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

/* ---------- tiny cells ---------- */
function Th({ children, className = "", ...rest }: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  return <th {...rest} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${className}`}>{children}</th>;
}
function Td({ children, className = "", ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...rest} className={`px-4 py-3 ${className}`}>{children}</td>;
}
