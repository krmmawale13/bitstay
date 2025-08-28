import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import { roomsService, hotelsService, type RoomDTO, type RoomStatus } from "@/services/property.service";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Pencil,
  Save,
  X,
  Check,
  RefreshCcw,
  Trash2,
} from "lucide-react";

/* toast */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

/* tiny helpers */
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

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

  const [data, setData] = useState<RoomDTO | null>(null);

  // meta
  const [statuses, setStatuses] = useState<RoomStatus[]>(["CLEAN", "DIRTY", "INSPECT", "OOO"]);
  const [roomTypes, setRoomTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [hotels, setHotels] = useState<Array<{ id: number; name: string }>>([]);

  // edit state
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<{
    hotelId: number | undefined;
    number: string;
    typeId?: number | undefined;
    rate: string;
    status: RoomStatus;
  }>({ hotelId: undefined, number: "", typeId: undefined, rate: "", status: "CLEAN" });

  // load meta + room
  useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [meta, room] = await Promise.all([roomsService.meta(), roomsService.get(roomId)]);
        if (!mounted) return;
        setStatuses(Array.isArray(meta?.statuses) ? meta.statuses : statuses);
        setRoomTypes(Array.isArray(meta?.roomTypes) ? meta.roomTypes : []);
        setHotels(Array.isArray(meta?.hotels) ? meta.hotels : []);
        setData(room);
        setForm({
          hotelId: room.hotelId,
          number: room.number ?? "",
          typeId: room.typeId ?? undefined,
          rate: room.rate ?? "",
          status: room.status,
        });
      } catch (e: any) {
        toast("error", "Failed to load room", e?.message);
        router.replace("/rooms");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  async function refresh() {
    if (!roomId) return;
    const r = await roomsService.get(roomId);
    setData(r);
    setForm({
      hotelId: r.hotelId,
      number: r.number ?? "",
      typeId: r.typeId ?? undefined,
      rate: r.rate ?? "",
      status: r.status,
    });
  }

  async function onSave() {
    if (!roomId) return;
    try {
      setBusy(true);
      await roomsService.update(roomId, {
        hotelId: form.hotelId!,
        number: (form.number || "").trim(),
        typeId: form.typeId,
        rate: (form.rate || "").trim(),
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

  async function onQuickStatus(next: RoomStatus) {
    if (!roomId) return;
    try {
      setBusy(true);
      await roomsService.updateStatus(roomId, next);
      toast("success", `Status → ${next}`);
      await refresh();
    } catch (e: any) {
      toast("error", "Status update failed", e?.message);
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

  if (!data) {
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
                <div className="text-2xl font-bold">Room #{data.number}</div>
                <div className="text-sm text-slate-500">
                  {data.hotel?.name ? (
                    <button
                      onClick={() => router.push(`/hotels/${data.hotelId}/edit`)}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                      title="Open hotel"
                    >
                      <Building2 size={14} />
                      {data.hotel.name}
                    </button>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!edit ? (
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
            ) : (
              <>
                <button
                  onClick={() => {
                    setEdit(false);
                    setForm({
                      hotelId: data.hotelId,
                      number: data.number,
                      typeId: data.typeId ?? undefined,
                      rate: data.rate,
                      status: data.status,
                    });
                  }}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={busy || !form.number.trim() || !form.hotelId || !form.rate.trim()}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
                >
                  <Save size={16} />
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* Room card (view/edit) */}
        <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80">
          {!edit ? (
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Field label="Hotel" value={data.hotel?.name ?? `#${data.hotelId}`} />
              <Field label="Room No." value={data.number} />
              <Field label="Type" value={data.type?.name ?? "—"} />
              <Field label="Rate" value={data.rate ?? "—"} />
              <div className="sm:col-span-2">
                <label className="text-sm text-slate-500">Status</label>
                <div className="mt-1">
                  <StatusBadge status={data.status} />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Hotel</label>
                <select
                  value={form.hotelId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, hotelId: Number(e.target.value) || undefined }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="">Select hotel…</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Room No.</label>
                <input
                  value={form.number}
                  onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={form.typeId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, typeId: Number(e.target.value) || undefined }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {roomTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Rate</label>
                <input
                  value={form.rate}
                  onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as RoomStatus }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Quick status actions */}
        <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Quick Status</div>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
              title="Refresh"
            >
              <RefreshCcw size={14} />
              Refresh
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {["CLEAN", "DIRTY", "INSPECT", "OOO"].map((s) => (
              <button
                key={s}
                onClick={() => onQuickStatus(s as RoomStatus)}
                disabled={busy || data.status === s}
                className={cls(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 transition",
                  s === "CLEAN"   && "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800",
                  s === "DIRTY"   && "bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-800",
                  s === "INSPECT" && "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800",
                  s === "OOO"     && "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100 dark:bg-slate-800/40 dark:text-slate-300 dark:ring-slate-700"
                )}
                title={`Mark ${s}`}
              >
                <Check size={14} />
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

/* ---------- bits ---------- */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: RoomStatus }) {
  return (
    <span
      className={cls(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ring-1",
        status === "CLEAN"   && "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800",
        status === "DIRTY"   && "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-800",
        status === "INSPECT" && "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800",
        status === "OOO"     && "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:ring-slate-700"
      )}
    >
      <Check size={14} />
      {status}
    </span>
  );
}
