// apps/frontend/src/pages/bookings/index.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import bookingsService, {
  ListParams,
  BookingStatus,
} from "@/services/bookings.service";
import { inr, fmtDateTime, statusLabel, statusChipClass, cls } from "@/lib/booking.util";
import {
  Plus,
  Search,
  Calendar,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  BedSingle,
  Users,
  ClipboardList,
  Clock3,
} from "lucide-react";

/* ---------------- toast helper ---------------- */
function toast(
  type: "success" | "error" | "info",
  message: string,
  description?: string
) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

/* ---------------- types used on this page ---------------- */
type Row = {
  id: number;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  customer?: { id: number; name?: string | null } | null;
  rooms?: { room: { id: number; number: string | number; type?: { name?: string } | null; hotel?: { name?: string } | null } }[];
  createdAt?: string;
  updatedAt?: string;
};

/* ---------------- page ---------------- */
export default function BookingsIndexPage() {
  const router = useRouter();

  // server paging
  const [page, setPage] = useState(1);
  const take = 20;

  // filters
  const [status, setStatus] = useState<"" | BookingStatus>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // summary
  const [summary, setSummary] = useState<{
    total: number;
    PENDING: number;
    CONFIRMED: number;
    CHECKED_IN: number;
    CHECKED_OUT: number;
    CANCELLED: number;
  } | null>(null);

  // search (client-side)
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  // focus search on '/' key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // load summary (range aware)
  async function loadSummary() {
    try {
      const s = await bookingsService.summary({
        from: from || undefined,
        to: to || undefined,
      });
      setSummary(s);
    } catch (e: any) {
      // summary is optional; don't block page
      setSummary(null);
      console.warn("summary failed", e?.message || e);
    }
  }

  // load list
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params: ListParams = {
        skip: (page - 1) * take,
        take,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      };
      const res = await bookingsService.list(params);
      setRows(Array.isArray(res.items) ? (res.items as Row[]) : []);
      setTotal(res.total ?? 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load bookings");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  // bootstrap + whenever filters/page change
  useEffect(() => {
    load();
    // summary refreshed with the same date filters
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, from, to]);

  // client-side search filter
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const text = `${r.id} ${r.customer?.name ?? ""} ${r.rooms?.map((x) => x.room.number).join(" ") ?? ""}`.toLowerCase();
      return text.includes(s);
    });
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(total / take));

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <ClipboardList size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
              <p className="text-sm text-slate-500">{total} total</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* search */}
            <div className="relative">
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search customer / room…  ( / to focus )"
                className="w-64 sm:w-72 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <Link
              href="/bookings/create"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-sm active:scale-[0.98]"
            >
              <Plus size={16} />
              New Booking
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard label="Total" value={summary?.total ?? 0} icon={<ClipboardList size={18} />} />
          <SummaryCard label="Pending" value={summary?.PENDING ?? 0} tone="amber" icon={<Clock3 size={18} />} />
          <SummaryCard label="Confirmed" value={summary?.CONFIRMED ?? 0} tone="sky" icon={<Calendar size={18} />} />
          <SummaryCard label="Checked-in" value={summary?.CHECKED_IN ?? 0} tone="emerald" icon={<Users size={18} />} />
          <SummaryCard label="Checked-out" value={summary?.CHECKED_OUT ?? 0} tone="blue" icon={<BedSingle size={18} />} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={status}
              onChange={(e) => {
                setStatus((e.target.value || "") as any);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked-in</option>
              <option value="CHECKED_OUT">Checked-out</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">From (Check-in)</label>
            <input
              type="datetime-local"
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">To (Check-out)</label>
            <input
              type="datetime-local"
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <button
            onClick={() => {
              setStatus("");
              setFrom("");
              setTo("");
              setQ("");
              setPage(1);
            }}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
            title="Clear filters"
          >
            <RefreshCcw size={16} />
            Reset
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
            <div className="font-semibold">Couldn’t load bookings</div>
            <div className="opacity-80">{error}</div>
          </div>
        )}

        {/* Table */}
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
            <div className="p-8 text-center text-slate-500">No bookings found.</div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <tr className="text-left">
                      <Th>ID</Th>
                      <Th>Customer</Th>
                      <Th>Schedule</Th>
                      <Th>Rooms</Th>
                      <Th>Status</Th>
                      <Th className="text-center">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filtered.map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => router.push(`/bookings/${b.id}`)}
                      >
                        <Td>#{b.id}</Td>
                        <Td className="font-medium">{b.customer?.name ?? "—"}</Td>
                        <Td className="text-slate-600">
                          <div className="flex flex-col">
                            <span>{fmtDateTime(b.checkIn)} →</span>
                            <span>{fmtDateTime(b.checkOut)}</span>
                          </div>
                        </Td>
                        <Td className="text-slate-700">
                          {b.rooms?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {b.rooms.slice(0, 3).map(({ room }) => (
                                <span key={room.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ring-slate-200 bg-slate-50">
                                  <BedSingle size={12} />
                                  #{room.number}
                                </span>
                              ))}
                              {b.rooms.length > 3 && (
                                <span className="text-xs text-slate-500">+{b.rooms.length - 3} more</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </Td>
                        <Td>
                          <span className={cls("inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1", statusChipClass(b.status))}>
                            {statusLabel(b.status)}
                          </span>
                        </Td>
                        <Td
                          className="text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/bookings/${b.id}`}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-900
                                       bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:ring-slate-700 transition"
                          >
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
                <div className="text-slate-600">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong> •{" "}
                  Showing{" "}
                  <strong>
                    {(page - 1) * take + 1}-{Math.min(page * take, total)}
                  </strong>{" "}
                  of <strong>{total}</strong>
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

/* ---------- summary card ---------- */
function SummaryCard({
  label,
  value,
  icon,
  tone = "slate",
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone?: "slate" | "amber" | "sky" | "emerald" | "blue";
}) {
  const toneMap: Record<string, string> = {
    slate:
      "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
    amber:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:ring-amber-800",
    sky: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-200 dark:ring-sky-800",
    emerald:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:ring-emerald-800",
    blue:
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:ring-blue-800",
  };
  return (
    <div className={cls("rounded-2xl border p-4 ring-1", toneMap[tone])}>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-white/70 dark:bg-white/10 flex items-center justify-center">
          {icon ?? <ClipboardList size={18} />}
        </div>
        <div>
          <div className="text-xs">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}
