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
} from "lucide-react";

/* ---------------- helpers ---------------- */
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function fmtDateShort(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}
function exportCsv(rows: any[]) {
  const head = [
    "ID",
    "Customer",
    "CheckIn",
    "CheckOut",
    "Status",
    "Rooms",
    "Source",
  ];
  const lines = rows.map((r) => [
    r.id,
    r.customer?.name ?? "",
    r.checkIn ?? "",
    r.checkOut ?? "",
    r.status ?? "",
    (r.rooms ?? [])
      .map((x: any) =>
        x?.room?.number ? `#${x.room.number}` : String(x?.roomId ?? "")
      )
      .join(" | "),
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
  const map: Record<
    string,
    { text: string; ring: string; bg: string; fg: string }
  > = {
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
    <span
      className={cls(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs ring-1",
        s.bg,
        s.fg,
        s.ring
      )}
      title={status}
    >
      {s.text}
    </span>
  );
}

/* ---------------- page ---------------- */
export default function BookingsIndexPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // meta + summary
  const [sources, setSources] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [summary, setSummary] = useState<{
    total: number;
    PENDING: number;
    CONFIRMED: number;
    CHECKED_IN: number;
    CHECKED_OUT: number;
    CANCELLED: number;
  } | null>(null);

  // view state (persist)
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [sourceId, setSourceId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // search focus on "/"
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

  // load meta + summary + list
  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      // meta
      const m = await bookingsService.getMeta();
      setSources(m?.sources ?? []);
      // summary
      const s = await bookingsService.summary(
        from && to ? { from, to } : undefined
      );
      if (s) setSummary(s as any);
      // list (keep server results manageable; client paginate)
      const list = await bookingsService.list(
        {
          status: (status as any) || undefined,
          sourceId: sourceId ? Number(sourceId) : undefined,
          from: from || undefined,
          to: to || undefined,
          skip: 0,
          take: 500,
        } as any
      );
      setRows(Array.isArray(list) ? list : (list as any).items ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load bookings");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // restore view state on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bookingsIndexView") || "{}");
      if (typeof saved.q === "string") setQ(saved.q);
      if (typeof saved.status === "string") setStatus(saved.status);
      if (typeof saved.sourceId === "string") setSourceId(saved.sourceId);
      if (typeof saved.from === "string") setFrom(saved.from);
      if (typeof saved.to === "string") setTo(saved.to);
      if (typeof saved.page === "number") setPage(saved.page);
    } catch {}
    // initial load
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // persist view state
  useEffect(() => {
    localStorage.setItem(
      "bookingsIndexView",
      JSON.stringify({ q, status, sourceId, from, to, page })
    );
  }, [q, status, sourceId, from, to, page]);

  // filtered (client-side text match + applied filters; server also filtered)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let arr = rows;
    if (s) {
      arr = arr.filter((r) => {
        const text = `${r.id} ${r.customer?.name ?? ""} ${r.source?.name ?? ""} ${r.rooms
          ?.map((x: any) => x?.room?.number ?? "")
          .join(" ")}`.toLowerCase();
        return text.includes(s);
      });
    }
    return arr;
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);
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
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Bookings
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filtered.length} of {rows.length} records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCsv(filtered)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-200 bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
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

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ["Total", summary?.total ?? 0],
            ["Pending", summary?.PENDING ?? 0],
            ["Confirmed", summary?.CONFIRMED ?? 0],
            ["Checked-in", summary?.CHECKED_IN ?? 0],
            ["Checked-out", summary?.CHECKED_OUT ?? 0],
            ["Cancelled", summary?.CANCELLED ?? 0],
          ].map(([label, val]) => (
            <div
              key={label as string}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {label}
              </div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {val as number}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search booking #, customer, room…  ( / to focus )"
              className="w-60 sm:w-72 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pl-9 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <Search
              size={16}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
            }}
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

          <button
            onClick={() => {
              setPage(1);
              loadAll();
            }}
            className="rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
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
            }}
            className="rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
            title="Clear filters"
          >
            Reset
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
            <div className="font-semibold">Couldn’t load bookings</div>
            <div className="opacity-80">{error}</div>
            <button
              onClick={loadAll}
              className="mt-2 inline-flex items-center rounded px-3 py-1 text-white bg-rose-600 hover:bg-rose-500"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table Card */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-10 w-56 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-64 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              No bookings found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <tr className="text-left">
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
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <Td>#{b.id}</Td>
                        <Td className="font-medium text-slate-900 dark:text-slate-100">
                          {b.customer?.name || "—"}
                        </Td>
                        <Td className="text-slate-700 dark:text-slate-300">
                          <div className="flex flex-col">
                            <span title={b.checkIn}>{fmtDateShort(b.checkIn)}</span>
                            <span className="text-xs text-slate-500" title={b.checkOut}>
                              {fmtDateShort(b.checkOut)}
                            </span>
                          </div>
                        </Td>
                        <Td className="text-slate-700 dark:text-slate-300">
                          {(b.rooms ?? []).length === 0 ? (
                            "—"
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(b.rooms ?? []).map((x: any) => (
                                <span
                                  key={x.id}
                                  className="inline-flex items-center rounded-md bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-xs ring-1 ring-slate-200 dark:ring-slate-700"
                                  title={[
                                    x.room?.type?.name && `Type: ${x.room.type.name}`,
                                    x.room?.hotel?.name && `Hotel: ${x.room.hotel.name}`,
                                    x.room?.rate && `₹${x.room.rate}`,
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")}
                                >
                                  #{x.room?.number ?? x.roomId}
                                </span>
                              ))}
                            </div>
                          )}
                        </Td>
                        <Td>
                          <StatusChip status={b.status} />
                        </Td>
                        <Td className="text-center">
                          <Link
                            href={`/bookings/${b.id}`}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-900
                                       bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:ring-slate-700 transition"
                            title="View"
                          >
                            <Eye size={16} />
                            View
                          </Link>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-sm">
                <div className="text-slate-600 dark:text-slate-300">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong> •{" "}
                  Showing{" "}
                  <strong>
                    {(page - 1) * perPage + 1}-
                    {Math.min(page * perPage, filtered.length)}
                  </strong>{" "}
                  of <strong>{filtered.length}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
                  >
                    <ChevronLeft size={16} />
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
                  >
                    Next
                    <ChevronRight size={16} />
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
function Th(
  { children, className = "", ...rest }:
  React.ThHTMLAttributes<HTMLTableHeaderCellElement>
) {
  return (
    <th
      {...rest}
      className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}
function Td(
  { children, className = "", colSpan, ...rest }:
  React.TdHTMLAttributes<HTMLTableCellElement>
) {
  return (
    <td
      {...rest}
      colSpan={colSpan}
      className={`whitespace-nowrap px-4 py-3 ${className}`}
    >
      {children}
    </td>
  );
}
