// apps/frontend/src/components/bookings/AllocateRoomModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import bookingsService from "@/services/bookings.service";
import { X, BedDouble, Building2, MapPin, Search, Loader2 } from "lucide-react";

/** Non-breaking toast helper (uses window.__toast if present). */
function notify(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

const inr = (n?: number | null) =>
  typeof n === "number" ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n) : "—";

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

  // close on outside click + escape
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
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
              {isNaN(new Date(checkInISO).getTime()) ? "—" : new Date(checkInISO).toLocaleString()} →{" "}
              {isNaN(new Date(checkOutISO).getTime()) ? "—" : new Date(checkOutISO).toLocaleString()}
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
        ...
        {/* (rest same as your code, with inr(r.rate) for price display) */}
      </div>
    </div>
  );
}
