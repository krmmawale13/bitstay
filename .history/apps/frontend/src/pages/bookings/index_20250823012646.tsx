// apps/frontend/src/pages/bookings/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import bookingsService, { BookingStatus, ListParams } from "@/services/bookings.service";
import http from "@/lib/http"; // (just to keep path alias consistent; not used here directly)
import Link from "next/link";

// --- Types for UI ---
type BookingRow = {
  id: number;
  customer?: { id: number; name: string };
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  rooms?: { room: { id: number; number: string } }[];
  createdAt?: string;
};

const STATUS_ORDER: BookingStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"];

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 ring-yellow-200",
    CONFIRMED: "bg-blue-100 text-blue-800 ring-blue-200",
    CHECKED_IN: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    CHECKED_OUT: "bg-gray-100 text-gray-800 ring-gray-200",
    CANCELLED: "bg-rose-100 text-rose-800 ring-rose-200",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", map[status])}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function BookingsDashboardPage() {
  // Filters
  const [from, setFrom] = useState<string>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [customerId, setCustomerId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  // Data
  const [items, setItems] = useState<BookingRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [skip, setSkip] = useState<number>(0);
  const [take, setTake] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(false);

  // Errors
  const [err, setErr] = useState<string | null>(null);

  const fetchList = async (params?: Partial<ListParams>) => {
    try {
      setLoading(true);
      setErr(null);
      const { items, total, skip, take } = await bookingsService.list({
        from,
        to,
        status: (status || undefined) as BookingStatus | undefined,
        customerId: customerId ? Number(customerId) : undefined,
        roomId: roomId ? Number(roomId) : undefined,
        skip,
        take,
        ...(params || {}),
      });
      setItems(items as any);
      setTotal(total);
      if (typeof params?.skip === "number") setSkip(params.skip);
      if (typeof params?.take === "number") setTake(params.take);
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || "Failed to load bookings.";
      setErr(message);
      (window as any).__toast?.push?.({
        type: "error",
        message: "Couldn’t load bookings",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    fetchList({ skip: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApplyFilters = () => {
    setSkip(0);
    fetchList({ skip: 0 });
  };

  const onResetFilters = () => {
    setStatus("");
    setCustomerId("");
    setRoomId("");
    const first = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    setFrom(first);
    setTo(today);
    setSkip(0);
    fetchList({ skip: 0 });
  };

  // KPIs (module dashboard on top) — computed client-side from current page
  const kpis = useMemo(() => {
    const byStatus: Record<BookingStatus, number> = {
      PENDING: 0, CONFIRMED: 0, CHECKED_IN: 0, CHECKED_OUT: 0, CANCELLED: 0,
    };
    for (const it of items) byStatus[it.status]++;
    return {
      totalInView: items.length,
      ...byStatus,
    };
  }, [items]);

  const pages = Math.max(1, Math.ceil(total / take));
  const pageIndex = Math.floor(skip / take) + 1;

  return (
    <>
      <Head>
        <title>Bookings — Dashboard</title>
      </Head>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
            <p className="text-sm text-muted-foreground">Overview, filters, and all bookings in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/bookings/create"
              className="inline-flex items-center rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              + New Booking
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <KpiCard title="In view" value={kpis.totalInView} />
          <KpiCard title="Pending" value={kpis.PENDING} tone="amber" />
          <KpiCard title="Confirmed" value={kpis.CONFIRMED} tone="blue" />
          <KpiCard title="Checked-in" value={kpis.CHECKED_IN} tone="emerald" />
          <KpiCard title="Cancelled" value={kpis.CANCELLED} tone="rose" />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border bg-white/60 backdrop-blur p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookingStatus | "")}
                className="mt-1 rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20"
              >
                <option value="">All</option>
                {STATUS_ORDER.map((s) => (
                  <option value={s} key={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600">Customer ID</label>
              <input
                type="number"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="e.g. 123"
                className="mt-1 rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600">Room ID</label>
              <input
                type="number"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. 205"
                className="mt-1 rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={onApplyFilters}
                className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                disabled={loading}
              >
                Apply
              </button>
              <button
                onClick={onResetFilters}
                className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                disabled={loading}
              >
                Reset
              </button>
            </div>
          </div>
          {err && <p className="mt-3 text-sm text-rose-600">Error: {err}</p>}
        </div>

        {/* Table */}
        <div className="rounded-2xl border bg-white/60 backdrop-blur p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-3 py-2 font-medium">Booking #</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Check-in</th>
                  <th className="px-3 py-2 font-medium">Check-out</th>
                  <th className="px-3 py-2 font-medium">Rooms</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={7}>Loading…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={7}>No bookings found.</td></tr>
                ) : (
                  items.map((b) => (
                    <tr key={b.id} className="border-t">
                      <td className="px-3 py-2">#{b.id}</td>
                      <td className="px-3 py-2">{b.customer?.name || "-"}</td>
                      <td className="px-3 py-2">{new Date(b.checkIn).toLocaleString()}</td>
                      <td className="px-3 py-2">{new Date(b.checkOut).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        {b.rooms?.length
                          ? b.rooms.map((r) => r.room.number).join(", ")
                          : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          href={`/bookings/${b.id}`}
                          className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-gray-500">
              Showing {items.length ? skip + 1 : 0}–{Math.min(skip + take, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                onClick={() => {
                  const nextSkip = Math.max(0, skip - take);
                  setSkip(nextSkip);
                  fetchList({ skip: nextSkip });
                }}
                disabled={skip === 0 || loading}
              >
                Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {pageIndex} / {pages}
              </span>
              <button
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                onClick={() => {
                  const nextSkip = Math.min((pages - 1) * take, skip + take);
                  setSkip(nextSkip);
                  fetchList({ skip: nextSkip });
                }}
                disabled={skip + take >= total || loading}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiCard({ title, value, tone }: { title: string; value: number | string; tone?: "amber" | "blue" | "emerald" | "rose" }) {
  const toneMap: Record<string, string> = {
    amber: "bg-amber-50 ring-amber-200",
    blue: "bg-blue-50 ring-blue-200",
    emerald: "bg-emerald-50 ring-emerald-200",
    rose: "bg-rose-50 ring-rose-200",
  };
  return (
    <div className={cx("rounded-2xl border bg-white/60 backdrop-blur p-4 shadow-sm ring-1", tone ? toneMap[tone] : "ring-gray-200")}>
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
