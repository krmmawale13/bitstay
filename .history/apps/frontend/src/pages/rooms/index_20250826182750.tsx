import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BedDouble, Plus, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { roomsService, type RoomDTO, type RoomsMeta, type RoomStatus } from "@/services/property.service";

/* ------------------------ tiny helpers ------------------------ */
function usePerms() {
  const [canManage, setCanManage] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("permissions");
      const perms = Array.isArray(JSON.parse(raw || "[]")) ? (JSON.parse(raw || "[]") as string[]) : [];
      setCanManage(perms.includes("hotels.manage"));
    } catch {
      setCanManage(false);
    }
  }, []);
  return { canManage };
}

function formatINR(v: string | number | null | undefined) {
  if (v === null || v === undefined) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return String(v);
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const STATUS_COLORS: Record<RoomStatus, string> = {
  CLEAN: "bg-emerald-100 text-emerald-800",
  DIRTY: "bg-rose-100 text-rose-800",
  INSPECT: "bg-amber-100 text-amber-800",
  OOO: "bg-slate-200 text-slate-700",
};

/* ----------------------------- page ----------------------------- */
export default function RoomsIndexPage() {
  const { canManage } = usePerms();

  const [items, setItems] = useState<RoomDTO[]>([]);
  const [meta, setMeta] = useState<RoomsMeta | null>(null);

  const [q, setQ] = useState("");
  const [hotelId, setHotelId] = useState<number | "">("");
  const [status, setStatus] = useState<RoomStatus | "">("");
  const [typeId, setTypeId] = useState<number | "">("");

  const [loading, setLoading] = useState(true);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // meta (hotels, roomTypes, statuses)
  useEffect(() => {
    let mounted = true;
    setLoadingMeta(true);
    roomsService
      .meta()
      .then((m) => {
        if (mounted) setMeta(m);
      })
      .catch((e) => {
        const msg = e?.response?.data?.message || e?.message || "Failed to load room metadata";
        (window as any).__toast?.push?.({ type: "error", message: msg });
      })
      .finally(() => mounted && setLoadingMeta(false));
    return () => void (mounted = false);
  }, []);

  // list rooms (server filter by hotelId; rest client-side)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const hid = hotelId === "" ? undefined : Number(hotelId);
    roomsService
      .list(hid)
      .then((data) => {
        if (mounted && Array.isArray(data)) setItems(data);
      })
      .catch((e) => {
        const msg = e?.response?.data?.message || e?.message || "Failed to load rooms";
        (window as any).__toast?.push?.({ type: "error", message: msg });
      })
      .finally(() => mounted && setLoading(false));
    return () => void (mounted = false);
  }, [hotelId]);

  const filtered = useMemo(() => {
    let out = items;
    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter(
        (r) =>
          r.number.toLowerCase().includes(s) ||
          (r.hotel?.name || "").toLowerCase().includes(s) ||
          (r.type?.name || "").toLowerCase().includes(s)
      );
    }
    if (status) out = out.filter((r) => r.status === status);
    if (typeId !== "") out = out.filter((r) => (r.typeId ?? null) === Number(typeId));
    return out;
  }, [items, q, status, typeId]);

  return (
    <>
      <Head>
        <title>Rooms | BitStay</title>
      </Head>

      <main className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center rounded-xl p-2 bg-gradient-to-br from-teal-500 to-indigo-600 text-white shadow">
              <BedDouble className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-semibold">Rooms</h1>
          </div>

          {canManage && (
            <Link
              href="/rooms/create"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-transparent
                         bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
            </Link>
          )}
        </div>

        {/* Toolbar */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search rooms by number, hotel, or type…"
              className="w-full rounded-xl border border-slate-200 bg-white/70 backdrop-blur px-10 py-2 outline-none
                         focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>

          <div className="md:col-span-7 flex flex-wrap gap-3 items-center">
            <div className="inline-flex items-center gap-2 text-slate-600">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filters</span>
            </div>

            {/* Hotel filter (server-side) */}
            <select
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={loadingMeta}
              className="rounded-xl border border-slate-200 bg-white/70 backdrop-blur px-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Hotels</option>
              {meta?.hotels?.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            {/* Status filter (client-side) */}
            <select
              value={status}
              onChange={(e) => setStatus((e.target.value || "") as RoomStatus | "")}
              disabled={loadingMeta}
              className="rounded-xl border border-slate-200 bg-white/70 backdrop-blur px-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              {meta?.statuses?.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Room type filter (client-side) */}
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={loadingMeta}
              className="rounded-xl border border-slate-200 bg-white/70 backdrop-blur px-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Room Types</option>
              {meta?.roomTypes?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Card (table) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border bg-white/70 backdrop-blur p-0 shadow-sm overflow-hidden"
        >
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-slate-500 border-b">
            <div className="col-span-2">Number</div>
            <div className="col-span-3">Hotel</div>
            <div className="col-span-3">Type</div>
            <div className="col-span-2">Rate</div>
            <div className="col-span-2 text-right">Status / Actions</div>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No rooms found.</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2 font-medium">{r.number}</div>
                    <div className="col-span-3 text-sm text-slate-700">
                      {r.hotel?.name || <span className="text-slate-400">—</span>}
                    </div>
                    <div className="col-span-3 text-sm text-slate-700">
                      {r.type?.name || <span className="text-slate-400">—</span>}
                    </div>
                    <div className="col-span-2 text-sm text-slate-700">
                      {formatINR(r.rate)}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[r.status]}`}
                        title={r.status}
                      >
                        {r.status}
                      </span>
                      <Link
                        href={`/rooms/${r.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </main>
    </>
  );
}
