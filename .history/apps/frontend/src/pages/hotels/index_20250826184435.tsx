import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MainLayout from "@/layouts/MainLayout";
import { hotelsService, roomsService, type HotelDTO, type RoomDTO } from "@/services/property.service";
import { Building2, Plus, Search, Download, ChevronLeft, ChevronRight } from "lucide-react";

/* ---------------- helpers ---------------- */
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function exportCsv(rows: Array<HotelDTO & { roomCount?: number }>) {
  const head = ["ID", "Name", "Address", "Rooms"];
  const lines = rows.map((h) => [h.id, h.name ?? "", h.address ?? "", h.roomCount ?? ""]);
  const csv = [head, ...lines]
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hotels.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- tiny SVG charts (no deps) ---------------- */
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

function Donut({
  data,
  colors,
  onSliceClick,
  centerText,
}: {
  data: { key: string; value: number; label: string }[];
  colors: Record<string, string>;
  onSliceClick?: (key: string) => void;
  centerText?: string;
}) {
  const total = Math.max(0, data.reduce((s, d) => s + d.value, 0));
  const R = 40;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] items-center gap-4">
      <div className="relative mx-auto">
        <div
          className="absolute inset-0 blur-xl rounded-full opacity-40"
          style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.15), transparent 70%)" }}
        />
        <svg viewBox="0 0 100 100" className="h-28 w-28 relative" role="img" aria-label="Distribution chart">
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
                stroke={colors[d.key] || "#64748b"}
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
            {centerText ?? `${total} total`}
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
              style={{ background: colors[d.key] || "#64748b" }}
            />
            <span className="truncate">{d.label}</span>
            <span className="ml-auto font-medium tabular-nums">{d.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- color helpers for KPI cards ---------------- */
const kpiColor = (key: string) => {
  switch (key) {
    case "TOTAL":
      return { from: "from-slate-500/10", to: "to-slate-500/5", ring: "ring-slate-400/30" };
    case "ROOMS":
      return { from: "from-indigo-600/15", to: "to-indigo-600/5", ring: "ring-indigo-500/40" };
    case "AVG":
      return { from: "from-blue-600/15", to: "to-blue-600/5", ring: "ring-blue-500/40" };
    case "TYPES":
      return { from: "from-amber-500/15", to: "to-amber-500/5", ring: "ring-amber-400/40" };
    case "ACTIVE":
      return { from: "from-emerald-600/15", to: "to-emerald-600/5", ring: "ring-emerald-500/40" };
    case "OOO":
      return { from: "from-rose-600/15", to: "to-rose-600/5", ring: "ring-rose-500/40" };
    default:
      return { from: "from-slate-500/10", to: "to-slate-500/5", ring: "ring-slate-400/30" };
  }
};

/* ---------------- page ---------------- */
export default function HotelsIndexPage() {
  const [hotels, setHotels] = useState<HotelDTO[]>([]);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
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
      const [hs, rs] = await Promise.all([hotelsService.list(), roomsService.list()]);
      setHotels(Array.isArray(hs) ? hs : []);
      setRooms(Array.isArray(rs) ? rs : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load hotels");
      setHotels([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // hotels with roomCount
  const hotelsWithCounts = useMemo(() => {
    const byHotel: Record<number, number> = {};
    for (const r of rooms) {
      byHotel[r.hotelId] = (byHotel[r.hotelId] || 0) + 1;
    }
    return hotels.map((h) => ({ ...h, roomCount: byHotel[h.id] || 0 }));
  }, [hotels, rooms]);

  // search filter
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return hotelsWithCounts;
    return hotelsWithCounts.filter(
      (h) =>
        (h.name || "").toLowerCase().includes(s) ||
        (h.address || "").toLowerCase().includes(s)
    );
  }, [hotelsWithCounts, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  // dashboard metrics
  const totalHotels = hotels.length;
  const totalRooms = rooms.length;
  const avgRooms = totalHotels ? +(totalRooms / totalHotels).toFixed(2) : 0;
  const uniqueTypes = useMemo(() => {
    const s = new Set(rooms.map((r) => r.typeId || 0).filter(Boolean));
    return s.size;
  }, [rooms]);
  const oooRooms = rooms.filter((r) => r.status === "OOO").length;
  const activeRooms = totalRooms - oooRooms;

  // donut: rooms by hotel (top 5 + others)
  const donutData = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const r of rooms) counts[r.hotelId] = (counts[r.hotelId] || 0) + 1;
    const pairs = Object.entries(counts)
      .map(([hid, v]) => ({ hid: Number(hid), value: v }))
      .sort((a, b) => b.value - a.value);
    const head = pairs.slice(0, 5);
    const tailSum = pairs.slice(5).reduce((s, p) => s + p.value, 0);
    const data = head.map((p) => {
      const hotelName = hotels.find((h) => h.id === p.hid)?.name || `Hotel #${p.hid}`;
      return { key: String(p.hid), value: p.value, label: hotelName };
    });
    if (tailSum > 0) data.push({ key: "others", value: tailSum, label: "Others" });
    return data;
  }, [rooms, hotels]);

  const donutColors = useMemo(() => {
    // deterministic but simple palette
    const base = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#64748b"];
    const map: Record<string, string> = {};
    donutData.forEach((d, i) => {
      map[d.key] = base[i % base.length];
    });
    return map;
  }, [donutData]);

  // sparkline: rooms created last 30 days
  const sparkPoints = useMemo(() => {
    const days = 30;
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));
    const counts = new Array(days).fill(0);
    for (const r of rooms) {
      const d = new Date(r.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      if (d < start || d > today) continue;
      const idx = Math.floor((d.getTime() - start.getTime()) / 86400000);
      if (idx >= 0 && idx < days) counts[idx] += 1;
    }
    return counts;
  }, [rooms]);

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
                {filtered.length} of {hotels.length} records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* search */}
            <div className="relative">
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search hotel name or address…  ( / )"
                className="w-60 sm:w-72 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-blue-300"
              />
              <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* export */}
            <button
              onClick={() => exportCsv(filtered)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-200
                         bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
              title="Export CSV"
            >
              <Download size={16} />
              Export
            </button>

            {/* create */}
            <Link
              href="/hotels/create"
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
              { key: "TOTAL", label: "Total Hotels", value: totalHotels, hint: "All properties" },
              { key: "ROOMS", label: "Total Rooms", value: totalRooms, hint: "Across hotels" },
              { key: "AVG", label: "Avg Rooms/Hotel", value: avgRooms, hint: "Rooms ÷ Hotels" },
              { key: "TYPES", label: "Room Types", value: uniqueTypes, hint: "Distinct type IDs" },
              { key: "ACTIVE", label: "Active Rooms", value: activeRooms, hint: "Not OOO" },
              { key: "OOO", label: "OOO Rooms", value: oooRooms, hint: "Out of order" },
            ].map((k) => {
              const c = kpiColor(k.key);
              return (
                <div
                  key={k.label}
                  className={cls(
                    "group relative overflow-hidden text-left rounded-xl border p-3 transition shadow-sm",
                    "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:shadow",
                    "ring-1 ring-transparent",
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
                </div>
              );
            })}
          </div>

          {/* Donut card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Rooms by Hotel</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Tap a slice/legend to focus</div>
              </div>
            </div>
            <div className="mt-2">
              <Donut
                data={donutData}
                colors={donutColors}
                centerText={`${totalRooms} rooms`}
                onSliceClick={(key) => {
                  if (key === "others") {
                    setQ("");
                  } else {
                    const hid = Number(key);
                    const name = hotels.find((h) => h.id === hid)?.name || "";
                    setQ(name);
                  }
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Sparkline row */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">New rooms (last 30 days)</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Creation trend</div>
            </div>
          </div>
          <div className="mt-2 text-indigo-600 dark:text-indigo-400">
            <Sparkline points={sparkPoints} />
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
            <div className="font-semibold">Couldn’t load hotels</div>
            <div className="opacity-80">{error}</div>
            <button
              onClick={loadAll}
              className="mt-2 inline-flex items-center rounded-lg px-3 py-1 text-white bg-rose-600 hover:bg-rose-500"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table Card */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
          {loading ? (
            <div className="p-6 animate-pulse space-y-3">
              <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-10 w-56 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-64 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No hotels found.</div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                    <tr>
                      <Th>Name</Th>
                      <Th>Address</Th>
                      <Th className="text-right">Rooms</Th>
                      <Th className="text-center">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {paged.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                        <Td className="font-medium">{h.name}</Td>
                        <Td className="text-slate-700 dark:text-slate-300">{h.address || "—"}</Td>
                        <Td className="text-right">{(h as any).roomCount ?? 0}</Td>
                        <Td className="text-center">
                          <Link
                            href={`/hotels/${h.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white
                                       bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                          >
                            Edit
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
