import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MainLayout from "@/layouts/MainLayout";
import { hotelsService, roomsService, type RoomDTO, type RoomStatus } from "@/services/property.service";
import {
  BedDouble,
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
function exportCsv(rows: RoomDTO[]) {
  const head = ["ID", "Hotel", "Number", "Type", "Rate", "Status"];
  const lines = rows.map((r) => [
    r.id,
    r.hotel?.name ?? "",
    r.number,
    r.type?.name ?? "",
    r.rate ?? "",
    r.status,
  ]);
  const csv = [head, ...lines]
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rooms.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- Status chip ---------------- */
const statusStyle: Record<RoomStatus, { bg: string; fg: string; ring: string; text: string }> = {
  CLEAN:   { bg: "bg-emerald-50 dark:bg-emerald-900/30", fg: "text-emerald-700 dark:text-emerald-200", ring: "ring-emerald-200 dark:ring-emerald-800", text: "Clean" },
  DIRTY:   { bg: "bg-rose-50 dark:bg-rose-900/30",       fg: "text-rose-700 dark:text-rose-200",       ring: "ring-rose-200 dark:ring-rose-800",       text: "Dirty" },
  INSPECT: { bg: "bg-amber-50 dark:bg-amber-900/30",     fg: "text-amber-700 dark:text-amber-200",     ring: "ring-amber-200 dark:ring-amber-800",     text: "Inspect" },
  OOO:     { bg: "bg-slate-50 dark:bg-slate-900/30",     fg: "text-slate-700 dark:text-slate-200",     ring: "ring-slate-200 dark:ring-slate-700",     text: "OOO" },
};
function StatusChip({ status }: { status: RoomStatus }) {
  const s = statusStyle[status] || statusStyle.CLEAN;
  return <span className={cls("inline-flex items-center rounded-full px-2.5 py-1 text-xs ring-1", s.bg, s.fg, s.ring)}>{s.text}</span>;
}

/* ---------------- page ---------------- */
export default function RoomsIndexPage() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof hotelsService.summary>> | null>(null); // reuse backend counts, no FE math
  const [meta, setMeta] = useState<{ hotels: { id: number; name: string }[]; roomTypes: { id: number; name: string }[]; statuses: RoomStatus[] }>({ hotels: [], roomTypes: [], statuses: ["CLEAN","DIRTY","INSPECT","OOO"] });
  const [rows, setRows] = useState<RoomDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // view state
  const [q, setQ] = useState("");
  const [hotelId, setHotelId] = useState<number | "">("");
  const [status, setStatus] = useState<RoomStatus | "">("");
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
      const [s, m, list] = await Promise.all([
        hotelsService.summary(),      // use backend-provided status counts (no FE calc)
        roomsService.meta(),
        roomsService.list(typeof hotelId === "number" ? hotelId : undefined),
      ]);
      setSummary(s);
      setMeta(m);
      setRows(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load rooms");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (s && !`${r.number} ${r.hotel?.name ?? ""} ${r.type?.name ?? ""}`.toLowerCase().includes(s)) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }, [rows, q, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  // KPI from backend summary (roomsByStatus + totals)
  const kpis = [
    { label: "Total Rooms", value: summary?.totals?.rooms ?? 0, hint: "Across hotels", grad: "from-blue-600/15 to-indigo-600/5", ring: "ring-blue-400/40" },
    { label: "Clean", value: summary?.roomsByStatus?.CLEAN ?? 0, hint: "Ready", grad: "from-emerald-600/15 to-emerald-600/5", ring: "ring-emerald-400/40" },
    { label: "Dirty", value: summary?.roomsByStatus?.DIRTY ?? 0, hint: "Needs cleaning", grad: "from-rose-600/15 to-rose-600/5", ring: "ring-rose-400/40" },
    { label: "Inspect", value: summary?.roomsByStatus?.INSPECT ?? 0, hint: "QA pending", grad: "from-amber-600/15 to-amber-600/5", ring: "ring-amber-400/40" },
    { label: "OOO", value: summary?.roomsByStatus?.OOO ?? 0, hint: "Out of order", grad: "from-slate-600/15 to-slate-600/5", ring: "ring-slate-400/40" },
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <BedDouble size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {(filtered?.length ?? 0)} of {rows.length} records {hotelId ? `• Hotel #${hotelId}` : ""}
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
                placeholder="Search room #, hotel, type…  ( / )"
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
              href="/rooms/create"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-sm active:scale-[0.98]"
            >
              <Plus size={16} />
              New
            </Link>
          </div>
        </div>

        {/* KPI row (no FE math; from hotels summary) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpis.map((k) => (
            <button
              key={k.label}
              onClick={() => {
                // quick filter buttons: if status label matches, apply
                const map: Record<string, RoomStatus | ""> = { Clean: "CLEAN", Dirty: "DIRTY", Inspect: "INSPECT", OOO: "OOO" } as any;
                const st = (map as any)[k.label] ?? "";
                setStatus(st);
                setPage(1);
              }}
              className={cls(
                "relative overflow-hidden text-left rounded-xl border p-3 transition shadow-sm",
                "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:shadow",
                "ring-1 ring-transparent hover:scale-[1.01]",
                k.ring
              )}
              title={k.hint}
            >
              <div className={cls("pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br", k.grad, "opacity-80")} />
              <div className="pointer-events-none absolute -top-1/2 left-0 h-full w-full translate-y-0 bg-white/10 blur-xl transition-transform duration-500" />
              <div className="relative">
                <div className="text-xs text-slate-500">{k.label}</div>
                <div className="mt-1 text-2xl font-semibold">{k.value}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">{k.hint}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hotel */}
          <select
            value={hotelId === "" ? "" : String(hotelId)}
            onChange={(e) => {
              const val = e.target.value;
              setHotelId(val ? Number(val) : "");
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            title="Hotel"
          >
            <option value="">All Hotels</option>
            {meta.hotels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => {
              setStatus((e.target.value || "") as RoomStatus | "");
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            title="Status"
          >
            <option value="">Status: All</option>
            {meta.statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Error alert */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
            <div className="font-semibold">Couldn’t load rooms</div>
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
            <div className="p-8 text-center text-slate-500">No rooms found.</div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                    <tr>
                      <Th>ID</Th>
                      <Th>Room #</Th>
                      <Th>Hotel</Th>
                      <Th>Type</Th>
                      <Th>Rate</Th>
                      <Th>Status</Th>
                      <Th className="text-center">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {paged.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                        <Td>#{r.id}</Td>
                        <Td className="font-medium">{r.number}</Td>
                        <Td className="text-slate-600 dark:text-slate-300">{r.hotel?.name || "—"}</Td>
                        <Td className="text-slate-600 dark:text-slate-300">{r.type?.name || "—"}</Td>
                        <Td>₹{r.rate}</Td>
                        <Td><StatusChip status={r.status} /></Td>
                        <Td className="text-center">
                          <Link
                            href={`/rooms/${r.id}/edit`}
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
