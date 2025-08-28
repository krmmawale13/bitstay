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
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")))
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
const HUES = [220, 265, 200, 15, 140, 300, 180, 30, 250, 100, 10, 330];

function DonutRoomsPerHotel({
  data,
  onSliceClick,
}: {
  data: { key: number; value: number; label: string }[];
  onSliceClick?: (hotelId: number) => void;
}) {
  const total = Math.max(0, data.reduce((s, d) => s + d.value, 0));
  const R = 44;
  const C = 2 * Math.PI * R;
  const [hover, setHover] = useState<number | null>(null);

  // map color by index to keep legend == chart color
  const colorFor = (i: number) => `hsl(${HUES[i % HUES.length]} 85% 50%)`;

  // precompute segments (start, len)
  let acc = 0;
  const segs = data.map((d, i) => {
    const start = acc;
    acc += d.value;
    const frac = total ? d.value / total : 0;
    return {
      ...d,
      i,
      start,
      len: frac * C,
      dash: `${Math.max(0, frac * C)} ${Math.max(0, C - frac * C)}`,
      offset: -((start / Math.max(total, 1)) * C),
      color: colorFor(i),
      percent: total ? Math.round((d.value / total) * 1000) / 10 : 0, // 0.1%
    };
  });

  const centerText = useMemo(() => {
    if (hover != null) {
      const h = segs.find((s) => s.key === hover);
      if (h) return `${h.value} • ${h.percent}%`;
    }
    return `${total} rooms`;
  }, [hover, segs, total]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] items-center gap-4">
      {/* chart */}
      <div className="relative mx-auto">
        <div
          className="absolute inset-0 blur-xl rounded-full opacity-40"
          style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.15), transparent 70%)" }}
        />
        <svg
          viewBox="0 0 120 120"
          className="h-32 w-32 relative"
          role="img"
          aria-label="Rooms distribution by hotel"
        >
          <g transform="translate(10,10)">
            {/* base track */}
            <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="12" />
            {/* segments */}
            {segs.map((s) => (
              <circle
                key={s.key}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === null || hover === s.key ? 12 : 10}
                strokeDasharray={s.dash}
                strokeDashoffset={s.offset}
                className="transition-[stroke-width,filter,transform] duration-200"
                style={{
                  cursor: onSliceClick ? "pointer" : "default",
                  filter: hover === null || hover === s.key ? "brightness(1)" : "grayscale(0.3) opacity(0.7)",
                }}
                onMouseEnter={() => setHover(s.key)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSliceClick?.(s.key)}
              />
            ))}
            {/* center label */}
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-slate-700 dark:fill-slate-200 text-[10px] font-medium select-none"
            >
              {centerText}
            </text>
          </g>
        </svg>
      </div>

      {/* legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {segs.map((s) => (
          <button
            key={s.key}
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSliceClick?.(s.key)}
            className={cls(
              "flex items-center gap-2 text-xs text-left rounded-lg px-2 py-1 transition",
              hover === null || hover === s.key ? "bg-slate-50 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
            title={`Filter: ${s.label}`}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="truncate">{s.label}</span>
            <span className="ml-auto tabular-nums">{s.value}</span>
            <span className="text-[10px] text-slate-500 w-10 text-right">{s.percent}%</span>
          </button>
        ))}
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

  // view state
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim().toLowerCase()), 180);
    return () => clearTimeout(t);
  }, [q]);

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
            {
              label: "Total Hotels",
              value: summary?.totals?.hotels ?? 0,
              hint: "All properties",
              ring: "ring-slate-300/40",
              grad: "from-slate-500/10 to-slate-500/5",
            },
            {
              label: "Total Rooms",
              value: summary?.totals?.rooms ?? 0,
              hint: "Across properties",
              ring: "ring-blue-400/40",
              grad: "from-blue-600/15 to-indigo-600/5",
            },
            {
              label: "Active Hotels",
              value: summary?.totals?.activeHotels ?? 0,
              hint: "> 0 rooms",
              ring: "ring-emerald-400/40",
              grad: "from-emerald-600/15 to-emerald-600/5",
            },
            {
              label: "OOO Rooms",
              value: summary?.roomsByStatus?.OOO ?? 0,
              hint: "Out of order",
              ring: "ring-rose-400/40",
              grad: "from-rose-600/15 to-rose-600/5",
            },
            {
              label: "Occupancy",
              value: `${summary?.occupancy?.percent ?? 0}%`,
              hint: `${summary?.occupancy?.occupiedRooms ?? 0} occupied`,
              ring: "ring-indigo-400/40",
              grad: "from-indigo-600/15 to-indigo-600/5",
            },
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
              <div className="text-sm text-slate-600 dark:text-slate-300">Hover to see % • Click to spotlight</div>
            </div>
          </div>
          <div className="mt-3">
            <DonutRoomsPerHotel
              data={donutData}
              onSliceClick={(hotelId) => {
                // spotlight: move clicked hotel to the top of the table list
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
                className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white
                           bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
              >
                <Plus size={16} />
                Create your first hotel
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h?[60vh]">
                <table className="min-w-full text-sm">
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
function Th({ children, className = "", ...rest }: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  return <th {...rest} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${className}`}>{children}</th>;
}
function Td({ children, className = "", ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...rest} className={`px-4 py-3 ${className}`}>{children}</td>;
}
