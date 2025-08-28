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

/* ---------------- toast (same style as detail page) ---------------- */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

/* ---------------- simple RBAC from localStorage ---------------- */
function usePerms() {
  const [perms, setPerms] = useState<string[]>([]);
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("permissions");
        const arr = raw ? JSON.parse(raw) : [];
        setPerms(Array.isArray(arr) ? arr.map(String) : []);
      } catch {
        setPerms([]);
      }
    };
    load();
    window.addEventListener("permissions:updated", load);
    return () => window.removeEventListener("permissions:updated", load);
  }, []);
  const has = (p: string | string[]) => {
    const want = Array.isArray(p) ? p : [p];
    return want.some((w) => perms.includes(w));
  };
  return { perms, has };
}

/* ---------------- status chip ---------------- */
function StatusChip({ status }: { status: string }) {
  const map: Record<string, { text: string; ring: string; bg: string; fg: string }> = {
    PENDING:   { text: "Pending",    ring: "ring-amber-200 dark:ring-amber-800",  bg: "bg-amber-50 dark:bg-amber-900/30",    fg: "text-amber-700 dark:text-amber-200" },
    CONFIRMED: { text: "Confirmed",  ring: "ring-blue-200 dark:ring-blue-800",    bg: "bg-blue-50 dark:bg-blue-900/30",      fg: "text-blue-700 dark:text-blue-200" },
    CHECKED_IN:{ text: "Checked-in", ring: "ring-emerald-200 dark:ring-emerald-800", bg: "bg-emerald-50 dark:bg-emerald-900/30", fg: "text-emerald-700 dark:text-emerald-200" },
    CHECKED_OUT:{text:"Checked-out", ring: "ring-slate-200 dark:ring-slate-700",  bg: "bg-slate-50 dark:bg-slate-800",       fg: "text-slate-700 dark:text-slate-300" },
    CANCELLED: { text: "Cancelled",  ring: "ring-rose-200 dark:ring-rose-800",    bg: "bg-rose-50 dark:bg-rose-900/30",      fg: "text-rose-700 dark:text-rose-200" },
  };
  const s = map[status] || map.PENDING;
  return <span className={cls("inline-flex items-center rounded-full px-2.5 py-1 text-xs ring-1", s.bg, s.fg, s.ring)}>{s.text}</span>;
}

/* ---------------- page ---------------- */
export default function BookingsIndexPage() {
  const { has } = usePerms();
  const canCreate = has(["booking.create", "bookings.create", "BOOKINGS_CREATE"]);
  const canView   = has(["booking.view", "bookings.view", "BOOKINGS_VIEW"]);
  const canExport = has(["booking.export", "bookings.export", "BOOKINGS_EXPORT"]);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // meta + summary
  const [sources, setSources] = useState<Array<{ id: number; name: string }>>([]);
  const [summary, setSummary] = useState<any>(null);

  // view state
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
        status: (status as any) || undefined,
        sourceId: sourceId ? Number(sourceId) : undefined,
        from: from || undefined,
        to: to || undefined,
        skip: 0,
        take: 500,
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

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
            {canExport && (
              <button
                onClick={() => exportCsv(filtered)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-200 bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
                title="Export CSV"
              >
                <Download size={16} />
                Export
              </button>
            )}
            {canCreate && (
              <Link
                href="/bookings/create"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                           bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-sm"
              >
                <Plus size={16} />
                New
              </Link>
            )}
          </div>
        </div>

        {/* KPIs */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              ["Total", summary.total ?? 0],
              ["Pending", summary.PENDING ?? 0],
              ["Confirmed", summary.CONFIRMED ?? 0],
              ["Checked-in", summary.CHECKED_IN ?? 0],
              ["Checked-out", summary.CHECKED_OUT ?? 0],
              ["Cancelled", summary.CANCELLED ?? 0],
            ].map(([label, val]) => (
              <div
                key={label as string}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
                <div className="text-lg font-semibold">{val as number}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* search */}
          <div className="relative">
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search booking #, customer, room…  ( / )"
              className="w-60 sm:w-72 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pl-9 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <Search
              size={16}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* status */}
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

          {/* source */}
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

          {/* date range */}
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            title="From"
          />
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            title="To"
          />

          {/* actions */}
          <button
            onClick={() => {
              setPage(1);
              loadAll();
            }}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200
                       bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
            title="Apply filters"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setQ("");
              setStatus("");
              setSourceId("");
              setFrom("");
              setTo("");
              setPage(1);
              loadAll();
              toast("info", "Filters cleared");
            }}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm
                       bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300
                       dark:from-slate-800 dark:to-slate-700 dark:hover:from-slate-700 dark:hover:to-slate-600
                       text-slate-800 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700"
            title="Clear filters"
          >
            <RefreshCcw size={16} />
            Reset
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
            <div className="font-semibold">Couldn’t load bookings</div>
            <div className="opacity-80">{error}</div>
            <button onClick={loadAll} className="mt-2 rounded-lg px-3 py-1 text-white bg-rose-600 hover:bg-rose-500">
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
                      <Th className="text-center">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {paged.map((b) => (
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
                                <span key={`${b.id}-${x.room?.id ?? x.id}`} className="inline-flex items-center rounded-md bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-xs ring-1 ring-slate-200 dark:ring-slate-700">
                                  #{x.room?.number ?? x.roomId}
                                </span>
                              ))}
                            </div>
                          ) : "—"}
                        </Td>
                        <Td><StatusChip status={b.status} /></Td>
                        <Td className="text-center">
                          {canView ? (
                            <Link
                              href={`/bookings/${b.id}`}
                              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                            >
                              <Eye size={16} /> View
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400">No permission</span>
                          )}
                        </Td>
                      </tr>
                    ))}
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
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg ring-1 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700">
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg ring-1 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700">
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
