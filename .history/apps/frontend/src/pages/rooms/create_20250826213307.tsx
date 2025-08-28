import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import { roomsService, type RoomStatus } from "@/services/property.service";
import { ArrowLeft, BedDouble, Save } from "lucide-react";

/* toast */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

export default function RoomCreatePage() {
  const router = useRouter();
  const qHotelId = useMemo(() => {
    const raw = String(router.query.hotelId || "");
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [router.query.hotelId]);

  const [busy, setBusy] = useState(false);

  // meta
  const [statuses, setStatuses] = useState<RoomStatus[]>(["CLEAN", "DIRTY", "INSPECT", "OOO"]);
  const [roomTypes, setRoomTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [hotels, setHotels] = useState<Array<{ id: number; name: string }>>([]);

  // form
  const [hotelId, setHotelId] = useState<number | undefined>(qHotelId);
  const [number, setNumber] = useState("");
  const [typeId, setTypeId] = useState<number | undefined>(undefined);
  const [rate, setRate] = useState("");
  const [status, setStatus] = useState<RoomStatus>("CLEAN");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const meta = await roomsService.meta();
        if (!mounted) return;
        setStatuses(Array.isArray(meta?.statuses) ? meta.statuses : statuses);
        setRoomTypes(Array.isArray(meta?.roomTypes) ? meta.roomTypes : []);
        setHotels(Array.isArray(meta?.hotels) ? meta.hotels : []);
        if (!hotelId && qHotelId) setHotelId(qHotelId);
      } catch (e: any) {
        toast("error", "Failed to load metadata", e?.message);
        router.replace("/rooms");
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave() {
    if (!hotelId || !number.trim() || !rate.trim()) {
      toast("error", "Please fill Hotel, Room No. and Rate");
      return;
    }
    try {
      setBusy(true);
      const room = await roomsService.create({
        hotelId,
        number: number.trim(),
        typeId,
        rate: rate.trim(),
        status,
      });
      toast("success", "Room created");
      router.replace(`/rooms/${room.id}/edit`);
    } catch (e: any) {
      toast("error", "Create failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/rooms")}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-sm">
                <BedDouble size={18} />
              </div>
              <div className="text-2xl font-bold">New Room</div>
            </div>
          </div>

          <button
            onClick={onSave}
            disabled={busy || !hotelId || !number.trim() || !rate.trim()}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
          >
            <Save size={16} />
            Save
          </button>
        </div>

        {/* Form card */}
        <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Hotel</label>
            <select
              value={hotelId ?? ""}
              onChange={(e) => setHotelId(Number(e.target.value) || undefined)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">Select hotel…</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Room No.</label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              value={typeId ?? ""}
              onChange={(e) => setTypeId(Number(e.target.value) || undefined)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {roomTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Rate</label>
            <input
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RoomStatus)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
