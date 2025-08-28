import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import { roomsService } from "@/services/property.service";
import {
  ArrowLeft,
  BedDouble,
  Pencil,
  Save,
  X,
  Check,
  RefreshCcw,
  Trash2,
  MapPin,
} from "lucide-react";

/* toast */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

/* helpers */
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
type RoomStatus = "CLEAN" | "DIRTY" | "INSPECT" | "OOO";

export default function RoomDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const roomId = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [id]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [meta, setMeta] = useState<{
    hotels: { id: number; name: string }[];
    roomTypes: { id: number; name: string }[];
    statuses: RoomStatus[];
  }>({ hotels: [], roomTypes: [], statuses: ["CLEAN", "DIRTY", "INSPECT", "OOO"] });

  const [room, setRoom] = useState<any | null>(null);

  // edit state
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<{ hotelId: number | ""; number: string; typeId: number | ""; rate: string; status: RoomStatus }>(
    { hotelId: "", number: "", typeId: "", rate: "", status: "CLEAN" }
  );

  // load meta + room
  useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [m, r] = await Promise.all([roomsService.meta(), roomsService.get(roomId)]);
        if (!mounted) return;
        setMeta(m || { hotels: [], roomTypes: [], statuses: ["CLEAN", "DIRTY", "INSPECT", "OOO"] });
        setRoom(r);
        setForm({
          hotelId: r?.hotelId ?? "",
          number: r?.number ?? "",
          typeId: r?.typeId ?? "",
          rate: r?.rate ?? "",
          status: r?.status ?? "CLEAN",
        });
      } catch (e: any) {
        toast("error", "Failed to load room", e?.message);
        router.replace("/rooms");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [roomId, router]);

  async function refresh() {
    if (!roomId) return;
    const r = await roomsService.get(roomId);
    setRoom(r);
    setForm({
      hotelId: r?.hotelId ?? "",
      number: r?.number ?? "",
      typeId: r?.typeId ?? "",
      rate: r?.rate ?? "",
      status: r?.status ?? "CLEAN",
    });
  }

  async function onSave() {
    if (!roomId) return;
    if (!form.number.trim() || !form.hotelId || !String(form.rate).trim()) {
      toast("error", "Please fill required fields", "Hotel, Room # and Rate are required.");
      return;
    }
    try {
      setBusy(true);
      await roomsService.update(roomId, {
        hotelId: Number(form.hotelId),
        number: form.number.trim(),
        typeId: form.typeId ? Number(form.typeId) : undefined,
        rate: String(form.rate).trim(),
        status: form.status,
      });
      toast("success", "Room updated");
      await refresh();
      setEdit(false);
    } catch (e: any) {
      toast("error", "Update failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  async function onQuickStatus(s: RoomStatus) {
    if (!roomId) return;
    try {
      setBusy(true);
      await roomsService.updateStatus(roomId, s);
      toast("success", `Status → ${s}`);
      await refresh();
    } catch (e: any) {
      toast("error", "Status change failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!roomId) return;
    if (!confirm("Delete this room? This cannot be undone.")) return;
    try {
      setBusy(true);
      await roomsService.remove(roomId);
      toast("success", "Room deleted");
      router.replace("/rooms");
    } catch (e: any) {
      toast("error", "Delete failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  if (!router.isReady || loading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <div className="h-9 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </MainLayout>
    );
  }

  if (!room) {
    return (
      <MainLayout>
        <div className="p-6 space-y-4">
          <button
            onClick={() => router.push("/rooms")}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-200">
            Room not found or access denied.
          </div>
        </div>
      </MainLayout>
    );
  }

  const hotelName = room.hotel?.name ?? `#${room.hotelId}`;
  const hotelAddress = room.hotel?.address ?? "—";

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
              <div>
                <div className="text-2xl font-bold">Room #{room.number}</div>
                <div className="text-sm text-slate-500">Hotel: {hotelName}</div>
                <div className="mt-0.5 text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={12} /> {hotelAddress || "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {edit ? (
              <>
                <button
                  onClick={() => { setEdit(false); refresh(); }}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={busy || !form.number.trim() || !form.hotelId || !String(form.rate).trim()}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
                >
                  <Save size={16} />
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEdit(true)}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  onClick={onDelete}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Room card (view/edit) */}
        <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80">
          {edit ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Hotel</label>
                <select
                  value={form.hotelId}
                  onChange={(e) => setForm((f) => ({ ...f, hotelId: Number(e.target.value) || "" }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">Select hotel…</option>
                  {meta.hotels.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Room #</label>
                <input
                  value={form.number}
                  onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={form.typeId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, typeId: Number(e.target.value) || "" }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">—</option>
                  {meta.roomTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Rate (₹)</label>
                <input
                  value={form.rate}
                  onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Status</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {meta.statuses.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status: s }))}
                      className={cls(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ring-1 transition",
                        form.status === s
                          ? "bg-indigo-600 text-white ring-indigo-500"
                          : "bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                      )}
                    >
                      <Check size={14} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div><span className="text-slate-500">Hotel:</span> <span className="font-medium">{hotelName}</span></div>
              <div><span className="text-slate-500">Room #:</span> <span className="font-medium">{room.number}</span></div>
              <div><span className="text-slate-500">Type:</span> <span className="font-medium">{room.type?.name ?? "—"}</span></div>
              <div><span className="text-slate-500">Rate:</span> <span className="font-medium">₹{room.rate}</span></div>
              <div className="sm:col-span-2">
                <div className="text-slate-500">Address:</div>
                <div className="font-medium">{hotelAddress || "—"}</div>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 mr-2">Status:</span>
                <span
                  className={cls(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ring-1",
                    room.status === "CLEAN"   && "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800",
                    room.status === "DIRTY"   && "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-800",
                    room.status === "INSPECT" && "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800",
                    room.status === "OOO"     && "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:ring-slate-700"
                  )}
                >
                  <Check size={14} />
                  {room.status}
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["CLEAN", "DIRTY", "INSPECT", "OOO"] as RoomStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => onQuickStatus(s)}
                      disabled={busy}
                      className={cls(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ring-1 transition disabled:opacity-60",
                        "bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
                      )}
                      title={`Set status: ${s}`}
                    >
                      <RefreshCcw size={14} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
