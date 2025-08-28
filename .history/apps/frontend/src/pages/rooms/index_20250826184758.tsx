import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MainLayout from "@/layouts/MainLayout";
import { roomsService, type RoomDTO, type RoomStatus } from "@/services/property.service";
import {
  BedDouble,
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
} from "lucide-react";

/* ---------------- helpers ---------------- */
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function exportCsv(rows: RoomDTO[]) {
  const head = ["ID", "Hotel", "Number", "Type", "Status", "Rate", "CreatedAt"];
  const lines = rows.map((r) => [
    r.id,
    r.hotel?.name ?? r.hotelId,
    r.number,
    r.type?.name ?? r.typeId ?? "",
    r.status,
    r.rate,
    r.createdAt,
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
function StatusChip({ status }: { status: RoomStatus }) {
  const map: Record<RoomStatus, { text: string; ring: string; bg: string; fg: string }> = {
    CLEAN: {
      text: "Clean",
      ring: "ring-emerald-200 dark:ring-emerald-800",
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      fg: "text-emerald-700 dark:text-emerald-200",
    },
    DIRTY: {
      text: "Dirty",
      ring: "ring-rose-200 dark:ring-rose-800",
      bg: "bg-rose-50 dark:bg-rose-900/30",
      fg: "text-rose-700 dark:text-rose-200",
    },
    INSPECT: {
      text: "Inspect",
      ring: "ring-amber-200 dark:ring-amber-800",
      bg: "bg-amber-50 dark:bg-amber-900/30",
      fg: "text-amber-700 dark:text-amber-200",
    },
    OOO: {
      text: "Out-of-Order",
      ring: "ring-slate-200 dark:ring-slate-700",
      bg: "bg-slate-50 dark:bg-slate-800",
      fg: "text-slate-700 dark:text-slate-300",
    },
  };
  const s = map[status] || map.CLEAN;
  return <span className={cls("inline-flex items-center rounded-full px-2.5 py-1 text-xs ring-1", s.bg, s.fg, s.ring)}>{s.text}</span>;
}

/* ---------------- KPI color helpers ---------------- */
const kpiColor = (key: string) => {
  switch (key) {
    case "TOTAL":
      return { from: "from-indigo-600/15", to: "to-indigo-600/5", ring: "ring-indigo-500/40" };
    case "CLEAN":
      return { from: "from-emerald-600/15", to: "to-emerald-600/5", ring: "ring-emerald-500/40" };
    case "DIRTY":
      return { from: "from-rose-600/15", to: "to-rose-600/5", ring: "ring-rose-500/40" };
    case "INSPECT":
      return { from: "from-amber-600/15", to: "to-amber-600/5", ring: "ring-amber-500/40" };
    case "OOO":
      return { from: "from-slate-600/15", to: "to-slate-600/5", ring: "ring-slate-500/40" };
    default:
      return { from: "from-slate-500/10", to: "to-slate-500/5", ring: "ring-slate-400/30" };
  }
};

/* ---------------- page ---------------- */
export default function RoomsIndexPage() {
  const [rows, setRows] = useState<RoomDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

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
      const res = await roomsService.list();
      setRows(Array.isArray(res) ? res : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load rooms");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      const text = `${r.id} ${r.number} ${r.hotel?.name ?? ""} ${r.type?.name ?? ""}`.toLowerCase();
      return !s || text.includes(s);
    });
  }, [rows, q, status]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const summary = useMemo(() => {
    const base = { TOTAL: rows.length, CLEAN: 0, DIRTY: 0, INSPECT: 0, OOO: 0 };
    rows.forEach((r) => (base[r.status as keyof typeof base]++));
    return base;
  }, [rows]);

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
                {filtered.length} of {rows.length} records
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
                placeholder="Search room #, hotel, type…  ( / )"
                className="w-60 sm:w-72 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-blue-300"
              />
              <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* status filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="CLEAN">Clean</option>
              <option value="DIRTY">Dirty</option>
              <option value="INSPECT">Inspect</option>
              <option value="OOO">Out-of-Order</option>
            </select>

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
              href="/rooms/create"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                         shadow-sm active:scale-[0.98]"
            >
              <Plus size={16} />
              New
            </Link>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(summary).map(([k, v]) => {
            const c = kpiColor(k);
            return (
              <div
                key={k}
                className={cls(
                  "group relative overflow-hidden text-left rounded-xl border p-3 transition shadow-sm",
                  "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:shadow",
                  "ring-1 ring-transparent hover:scale-[1.01]",
                  c.ring
                )}
                title={k}
              >
                <div className={cls("pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br", c.from, c.to, "opacity-80")} />
                <div className="relative">
                  <div className="text-xs text-slate-500">{k}</div>
                  <div className="mt-1 text-2xl font-semibold">{v}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
            <div className="font-semibold">Couldn’t load rooms</div>
            <div className="opacity-80">{error}</div>
            <button
              onClick={loadAll}
              className="mt-2 inline-flex items-center rounded px-3 py-1 text-white bg-rose-600 hover:bg-rose-500"
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
                      <Th>#</Th>
                      <Th>Hotel</Th>
                      <Th>Number</Th>
                      <Th>Type</Th>
                      <Th>Status</Th>
                      <Th>Rate</Th>
                      <Th className="text-center">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {paged.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                        <Td>#{r.id}</Td>
                        <Td>{r.hotel?.name || r.hotelId}</Td>
                        <Td>{r.number}</Td>
                        <Td>{r.type?.name || r.typeId || "—"}</Td>
                        <Td><StatusChip status={r.status} /></Td>
                        <Td>₹{r.rate}</Td>
                        <Td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/rooms/${r.id}/edit`}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white
                                         bg-amber-500/90 hover:bg-amber-500 transition shadow-sm"
                            >
                              <Pencil size={16} />
                              Edit
                            </Link>
                            <Link
                              href={`/rooms/${r.id}`}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-900
                                         bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:ring-slate-700 transition"
                            >
                              <Eye size={16} />
                              View
                            </Link>
                          </div>
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
