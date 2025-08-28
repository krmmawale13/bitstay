// apps/frontend/src/components/bookings/AllocateRoomModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import bookingsService from "@/services/bookings.service";
import { X, BedDouble, Building2, MapPin, Search, Loader2 } from "lucide-react";

/** Non-breaking toast helper (uses window.__toast if present). */
function notify(
  type: "success" | "error" | "info",
  message: string,
  description?: string
) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  if (api?.push) api.push({ type, message, description });
  else console.log(`[toast:${type}]`, message, description ?? "");
}

type RoomItem = {
  id: number;
  number?: string | number | null;
  rate?: number | null;
  type?: { id: number; name: string } | null;
  hotel?: { id: number; name: string } | null;
};

export default function AllocateRoomModal({
  bookingId,
  checkInISO,
  checkOutISO,
  hotelId,
  onClose,
  onSuccess,
}: {
  bookingId: number;
  checkInISO: string;
  checkOutISO: string;
  hotelId?: number;
  onClose: () => void;
  onSuccess?: (roomId: number) => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // view state
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<"number" | "rate">("number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsService.availability({
        checkIn: checkInISO,
        checkOut: checkOutISO,
        hotelId,
      });
      setRooms(Array.isArray(res?.rooms) ? (res.rooms as RoomItem[]) : []);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch available rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkInISO, checkOutISO, hotelId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let out = rooms;
    if (s) {
      out = out.filter((r) => {
        const text = `${r.number ?? ""} ${r.type?.name ?? ""} ${r.hotel?.name ?? ""}`.toLowerCase();
        return text.includes(s);
      });
    }
    out = [...out].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "number") {
        return dir * String(a.number ?? "").localeCompare(String(b.number ?? ""));
      } else {
        const ra = Number(a.rate ?? 0);
        const rb = Number(b.rate ?? 0);
        return dir * (ra - rb);
      }
    });
    return out;
  }, [rooms, q, sortKey, sortDir]);

  async function handleAllocate() {
    if (!selected) return;
    try {
      setBusy(true);
      await bookingsService.allocateRoom(bookingId, { newRoomId: selected });
      notify("success", "Room allocated");
      onSuccess?.(selected);
      onClose();
    } catch (e: any) {
      notify("error", "Allocate room failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={panelRef}
        className="relative z-[101] w-full max-w-3xl rounded-2xl border border-white/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl"
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/30 dark:border-slate-800">
          <div>
            <div className="text-sm font-semibold">Allocate Room</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(checkInISO).toLocaleString()} → {new Date(checkOutISO).toLocaleString()}
              {hotelId ? ` • Hotel #${hotelId}` : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* toolbar */}
        <div className="px-5 py-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search room no, type, hotel…"
              className="w-64 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pl-9 text-sm"
            />
            <Search
              size={16}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              title="Sort by"
            >
              <option value="number">Sort: Room #</option>
              <option value="rate">Sort: Rate</option>
            </select>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as any)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              title="Direction"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
            <button
              onClick={load}
              className="rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700 inline-flex items-center gap-2"
              title="Refresh"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Refresh
            </button>
          </div>
        </div>

        {/* body */}
        <div className="max-h-[70vh] overflow-auto px-5 pb-5">
          {error && (
            <div className="mb-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
              <div className="font-semibold">Couldn’t load available rooms</div>
              <div className="opacity-80">{error}</div>
            </div>
          )}

          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-24 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-24 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400">
              No rooms available for the selected window.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {filtered.map((r) => {
                const isActive = selected === r.id;
                return (
                  <li
                    key={r.id}
                    className={`
                      rounded-xl border p-4 cursor-pointer transition
                      ${isActive
                        ? "border-blue-500 bg-blue-50/60 dark:border-blue-600 dark:bg-blue-900/20"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"}
                    `}
                    onClick={() => setSelected(r.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                          <BedDouble size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            Room #{r.number ?? r.id}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {r.type?.name ?? "—"} • {r.hotel?.name ?? "—"}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {typeof r.rate === "number" ? `₹${r.rate}` : "—"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-white/30 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Building2 size={14} />
            <span>
              {filtered.length} room{filtered.length === 1 ? "" : "s"} available
            </span>
            <span className="mx-1">•</span>
            <MapPin size={14} />
            <span>{hotelId ? `Hotel #${hotelId}` : "All hotels"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              onClick={handleAllocate}
              disabled={!selected || busy}
              className="rounded-lg px-3 py-1.5 text-sm text-white shadow-sm
                         bg-blue-600 hover:bg-blue-500 disabled:opacity-60 inline-flex items-center gap-2"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              Allocate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
