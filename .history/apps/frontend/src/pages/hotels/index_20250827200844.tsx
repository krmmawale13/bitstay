// apps/frontend/src/pages/hotels/index.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MainLayout from "@/layouts/MainLayout";
import { hotelsService } from "@/services/property.service";
import {
  Building2,
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
function exportCsv(rows: Array<{ id: number; name: string; address?: string | null; rooms: number }>) {
  const head = ["ID", "Hotel", "Address", "Rooms"];
  const lines = rows.map((r) => [r.id, r.name, r.address ?? "", r.rooms ?? 0]);
  const csv = [head, ...lines]
    .map((r) =>
      r
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hotels.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- tiny donut (rooms per hotel) ---------------- */
function DonutRoomsPerHotel({
  data,
  onSliceClick,
}: {
  data: { key: number; value: number; label: string }[];
  onSliceClick?: (hotelId: number) => void;
}) {
  const total = Math.max(0, data.reduce((s, d) => s + d.value, 0));
  const R = 40;
  const STROKE = 12;
  const C = 2 * Math.PI * R;
  const hues = [220, 265, 200, 15, 140, 300, 180, 30, 250, 95];
  let acc = 0;

  const colors = data.map((_, i) => `hsl(${hues[i % hues.length]} 85% 50%)`);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] items-center gap-4">
      <div className="relative mx-auto">
        <div
          className="absolute inset-0 blur-xl rounded-full opacity-40"
          style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.16), transparent 70%)" }}
        />
        <svg
          viewBox="0 0 100 100"
          className="h-32 w-32 relative"
          role="img"
          aria-label="Rooms distribution by hotel"
        >
          <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth={STROKE} />
          {data.map((d, i) => {
            const frac = total ? d.value / total : 0;
            const len = Math.max(0, frac * C);
            const dash = `${len} ${C - len}`;
            const offset = -(acc / Math.max(total, 1)) * C;
            acc += d.value;
            return (
              <circle
                key={d.key}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={colors[i]}
                strokeWidth={STROKE}
                strokeDasharray={dash}
                strokeDashoffset={offset}
                className="transition hover:brightness-110 active:scale-[1.01]"
                style={{ cursor: onSliceClick ? "pointer" : "default" }}
                onClick={() => onSliceClick?.(d.key)}
              />
            );
          })}
          <g aria-hidden="true">
            <text x="50" y="46" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200 text-[10px]">
              Total Rooms
            </text>
            <text x="50" y="59" textAnchor="middle" className="fill-slate-900 dark:fill-slate-100 text-sm font-semibold">
              {total}
            </text>
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {data.map((d, i) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          return (
            <button
              key={d.key}
              onClick={() => onSliceClick?.(d.key)}
              className="flex items-center gap-2 text-xs text-left rounded-lg px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"
              title={`Filter: ${d.label}`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[i] }}
                aria-hidden
              />
              <span className="truncate">{d.label}</span>
              <span className="ml-auto tabular-nums">
                <span className="font-medium">{d.value}</span>
                <span className="opacity-60"> • {pct}%</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function HotelsIndexPage() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof hotelsService.summary>> | null>(null);
  const [rows, setRows] = useState<Array<{ id: number; name: string; address?: string | null; rooms: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim().toLowerCase()), 180);
    return () => clearTimeout(t);
  }, [q]);

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

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const s = await hotelsService.summary();
      setSummary(s);
      const perHotel = s?.perHotel ?? [];
      setRows(
        perHotel.map((h) => ({
          id: h.id,
          name: h.name,
          address: h.address ?? "",
          rooms: h.rooms,
        }))
      );
    } catch (e: any) {
      setError(e?.message || "Failed to load hotels");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!qDebounced) return rows;
    return rows.filter((r) => `${r.id} ${r.name} ${r.address ?? ""}`.toLowerCase().includes(qDebounced));
  }, [rows, qDebounced]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  const donutData = useMemo(
    () => (summary?.perHotel ?? []).map((h) => ({ key: h.id, value: h.rooms, label: h.name })),
    [summary]
  );

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Building2 size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Hotels</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {(filtered?.length ?? 0)} listed • {summary?.totals?.hotels ?? 0} total properties
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search hotels…  ( / )"
                className="w-60 sm:w-72 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pl-9 text-sm"
              />
              <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

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
              href="/hotels/create"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-sm active:scale-[0.98]"
            >
              <Plus size={16} />
              New
            </Link>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Hotels", value: summary?.totals?.hotels ?? 0, hint: "All properties", ring: "ring-slate-300/40", grad: "from-slate-500/10 to-slate-500/5" },
            { label: "Total Rooms", value: summary?.totals?.rooms ?? 0, hint: "Across properties", ring: "ring-blue-400/40", grad: "from-blue-600/15 to-indigo-600/5" },
            { label: "Active Hotels", value: summary?.totals?.activeHotels ?? 0, hint: "> 0 rooms", ring: "ring-emerald-400/40", grad: "from-emerald-600/15 to-emerald-600/5" },
            { label: "OOO Rooms", value: summary?.roomsByStatus?.OOO ?? 0, hint: "Out of order", ring: "ring-rose-400/40", grad: "from-rose-600/15 to-rose-600/5" },
            { label: "Occupancy", value: `${summary?.occupancy?.percent ?? 0}%`, hint: `${summary?.occupancy?.occupiedRooms ?? 0} occupied`, ring: "ring-indigo-400/40", grad: "from-indigo-600/15 to-indigo-600/5" },
          ].map((k) => (
            <div
              key={k.label}
              className={cls(
                "relative overflow-hidden text-left rounded-xl border p-3 transition shadow-sm",
                "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:shadow",
                "ring-1 ring-transparent hover:scale-[1.01]",
                k.ring
              )}
              title={k.hint}
            >
              <div className={cls("pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br", k.grad, "opacity-80")} />
              <div className="relative">
                <div className="text-xs text-slate-500">{k.label}</div>
                <div className="mt-1 text-2xl font-semibold">{k.value}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">{k.hint}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Donut card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Rooms per hotel</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Click a slice or legend item to spotlight</div>
            </div>
          </div>
          <div className="mt-2">
            <DonutRoomsPerHotel
              data={donutData}
              onSliceClick={(hotelId) => {
                const idx = rows.findIndex((r) => r.id === hotelId);
                if (idx >= 0) {
                  const copy = [...rows];
                  const [item] = copy.splice(idx, 1);
                  copy.unshift(item);
                  setRows(copy);
                  setPage(1);
                }
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
          {loading ? (
            <div className="p-6 animate-pulse space-y-3">
              <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-10 w-56 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-64 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ) : error ? (
            <div className="p-8 text-sm text-rose-700 dark:text-rose-200">Error: {error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-slate-500">No hotels found.</div>
              <Link
                href="/hotels/create"
                className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
              >
                <Plus size={16} />
                Create your first hotel
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full text-sm">
                  <colgroup>
                    <col className="w-[80px]" />
                    <col />
                    <col />
                    <col className="w-[120px]" />
                    <col className="w-[120px]" />
                  </colgroup>
                  <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 backdrop-blur">
                    <tr>
                      <Th>ID</Th>
                      <Th>Hotel</Th>
                      <Th>Address</Th>
                      <Th>Rooms</Th>
                      <Th className="text-center">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {paged.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                        <Td>#{h.id}</Td>
                        <Td className="font-medium">{h.name}</Td>
                        <Td className="text-slate-600 dark:text-slate-300">{h.address || "—"}</Td>
                        <Td>{h.rooms ?? 0}</Td>
                        <Td className="text-center">
                          <Link
                            href={`/hotels/${h.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white
                                       bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                          >
                            <Eye size={16} /> View
                          </Link>
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
function Th({
  children,
  className = "",
  ...rest
}: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  return (
    <th
      {...rest}
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...rest} className={`px-4 py-3 ${className}`}>{children}</td>;
}
