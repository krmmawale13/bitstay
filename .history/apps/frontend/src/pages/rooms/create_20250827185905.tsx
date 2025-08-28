import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import { roomsService, type RoomStatus, type AmenityDTO } from "@/services/property.service";
import {
  ArrowLeft,
  BedDouble,
  Save,
  AlertCircle,
  Loader2,
  Plus,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Settings2,
} from "lucide-react";
import { motion } from "framer-motion";
import ManageTypeAmenitiesModal from "@/components/rooms/ManageTypeAmenitiesModal";

/* toast */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* validation (aligned with backend) */
const RATE_RE = /^\d+(\.\d{1,2})?$/;
function validate(f: { hotelId?: number; number: string; rate: string }) {
  const e: Record<string, string> = {};
  if (!f.hotelId) e.hotelId = "Please select a hotel";
  if (!f.number.trim()) e.number = "Room number is required";
  else if (f.number.trim().length > 20) e.number = "Room number must be ≤ 20 characters";
  if (!f.rate.trim()) e.rate = "Rate is required";
  else if (!RATE_RE.test(f.rate.trim())) e.rate = "Rate must be a number with up to 2 decimals";
  return e;
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

  // derived amenities (from selected room type)
  const [amenities, setAmenities] = useState<AmenityDTO[]>([]);

  // images (URLs)
  const [newImageUrl, setNewImageUrl] = useState("");
  const [pendingUrls, setPendingUrls] = useState<string[]>([]);
  const addUrl = () => {
    const u = newImageUrl.trim();
    if (!u) return;
    setPendingUrls((p) => [...p, u]);
    setNewImageUrl("");
  };
  const removePendingUrl = (i: number) => setPendingUrls((p) => p.filter((_, idx) => idx !== i));

  // client errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const invalid = Object.keys(errors).length > 0;

  // modal for managing RoomType amenities
  const [showAmenityModal, setShowAmenityModal] = useState(false);

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
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch amenities for selected room type
  const loadTypeAmenities = useCallback(async (rid?: number) => {
    if (!rid) {
      setAmenities([]);
      return;
    }
    try {
      const res = await roomsService.getTypeAmenities(rid);
      setAmenities(Array.isArray(res?.amenities) ? res.amenities : []);
    } catch (e: any) {
      setAmenities([]);
      toast("error", "Failed to load amenities for this type", e?.message);
    }
  }, []);

  useEffect(() => {
    void loadTypeAmenities(typeId);
  }, [typeId, loadTypeAmenities]);

  async function onSave() {
    const nextErrors = validate({ hotelId, number, rate });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast("error", "Please fix validation errors");
      return;
    }

    try {
      setBusy(true);
      const payload: any = {
        hotelId: hotelId!,
        number: number.trim(),
        typeId,
        rate: rate.trim(),
        status,
      };

      const room = await roomsService.create(payload);

      if (pendingUrls.length) {
        try {
          await roomsService.addImages(room.id, pendingUrls);
          toast("success", "Images attached successfully");
        } catch (e: any) {
          toast("error", "Images not attached", e?.message);
        }
      }

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
            disabled={busy || !hotelId || !number.trim() || !rate.trim() || invalid}
            className={cls(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60",
              invalid && "animate-pulse"
            )}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 grid gap-4 sm:grid-cols-2"
        >
          {/* Hotel */}
          <div>
            <label className="text-sm font-medium">Hotel</label>
            <select
              value={hotelId ?? ""}
              onChange={(e) => {
                const v = Number(e.target.value) || undefined;
                setHotelId(v);
                setErrors((prev) => {
                  const next = { ...prev };
                  if (v) delete next.hotelId;
                  else next.hotelId = "Please select a hotel";
                  return next;
                });
              }}
              className={cls(
                "mt-1 w-full rounded-xl border bg-white dark:bg-slate-900 px-3 py-2 text-sm",
                errors.hotelId ? "border-rose-400 dark:border-rose-500" : "border-slate-300 dark:border-slate-700"
              )}
              aria-invalid={!!errors.hotelId}
            >
              <option value="">Select hotel…</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            {errors.hotelId && <ErrorHint>{errors.hotelId}</ErrorHint>}
          </div>

          {/* Room No. */}
          <div>
            <label className="text-sm font-medium">Room No.</label>
            <input
              value={number}
              onChange={(e) => {
                const val = e.target.value;
                setNumber(val);
                setErrors((prev) => {
                  const next = { ...prev };
                  if (val.trim() && val.trim().length <= 20) delete next.number;
                  else if (!val.trim()) next.number = "Room number is required";
                  else next.number = "Room number must be ≤ 20 characters";
                  return next;
                });
              }}
              className={cls(
                "mt-1 w-full rounded-xl border bg-white dark:bg-slate-900 px-3 py-2 text-sm",
                errors.number ? "border-rose-400 dark:border-rose-500" : "border-slate-300 dark:border-slate-700"
              )}
              aria-invalid={!!errors.number}
            />
            {errors.number && <ErrorHint>{errors.number}</ErrorHint>}
          </div>

          {/* Type (optional) */}
          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              value={typeId ?? ""}
              onChange={(e) => setTypeId(Number(e.target.value) || undefined)}
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

          {/* Rate */}
          <div>
            <label className="text-sm font-medium">Rate</label>
            <input
              value={rate}
              onChange={(e) => {
                const val = e.target.value;
                setRate(val);
                setErrors((prev) => {
                  const next = { ...prev };
                  if (!val.trim()) next.rate = "Rate is required";
                  else if (!RATE_RE.test(val.trim())) next.rate = "Rate must be a number with up to 2 decimals";
                  else delete next.rate;
                  return next;
                });
              }}
              inputMode="decimal"
              className={cls(
                "mt-1 w-full rounded-xl border bg-white dark:bg-slate-900 px-3 py-2 text-sm",
                errors.rate ? "border-rose-400 dark:border-rose-500" : "border-slate-300 dark:border-slate-700"
              )}
              aria-invalid={!!errors.rate}
            />
            {errors.rate && <ErrorHint>{errors.rate}</ErrorHint>}
          </div>

          {/* Status */}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RoomStatus)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Derived Amenities (by selected room type) */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Amenities (by Room Type)</div>
            <button
              type="button"
              onClick={() => setShowAmenityModal(true)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700 disabled:opacity-40"
              title="Manage amenities for this room type"
              disabled={!typeId}
            >
              <Settings2 size={14} />
              Manage type amenities
            </button>
          </div>

          {!typeId ? (
            <div className="mt-2 text-sm text-slate-500">Select a room type to preview derived amenities.</div>
          ) : amenities.length === 0 ? (
            <div className="mt-2 text-sm text-slate-500">No amenities found for this type yet.</div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {amenities.map((a) => (
                <span
                  key={a.id}
                  className="px-3 py-1.5 rounded-full text-sm ring-1 ring-emerald-300 bg-emerald-50 text-emerald-700 dark:ring-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 flex items-center gap-1"
                >
                  <CheckCircle2 size={14} />
                  {a.name}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Images */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80"
        >
          <div className="text-sm font-semibold mb-2 flex items-center gap-2">
            <ImageIcon size={16} /> Images (URLs)
          </div>
          <div className="flex gap-2">
            <input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://…"
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addUrl}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          {pendingUrls.length > 0 && (
            <div className="mt-3 grid gap-2">
              {pendingUrls.map((u, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm">
                  <span className="truncate">{u}</span>
                  <button onClick={() => removePendingUrl(i)} className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-500">
                    <X size={14} /> remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 text-xs text-slate-500">After create, these URLs will be attached to the room.</div>
        </motion.div>

        {invalid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-rose-200 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-800 dark:text-rose-200 flex items-start gap-2"
          >
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <div>Please resolve the highlighted fields before saving.</div>
          </motion.div>
        )}
      </div>

      {/* Manage RoomType Amenities modal */}
      {showAmenityModal && !!typeId && (
        <ManageTypeAmenitiesModal
          open={showAmenityModal}
          typeId={typeId}
          onClose={() => setShowAmenityModal(false)}
          onSaved={async () => {
            await loadTypeAmenities(typeId);
            toast("success", "Amenities updated for this type");
          }}
        />
      )}
    </MainLayout>
  );
}

function ErrorHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 text-xs text-rose-600 dark:text-rose-300 inline-flex items-center gap-1">
      <AlertCircle size={12} />
      <span>{children}</span>
    </div>
  );
}
