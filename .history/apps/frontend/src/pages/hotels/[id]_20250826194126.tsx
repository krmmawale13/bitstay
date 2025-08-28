import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import { hotelsService, roomsService } from "@/services/property.service";
import { ArrowLeft, Building2, Pencil, Save, X, Trash2, MapPin, BedDouble } from "lucide-react";

/* toast */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function HotelDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const hotelId = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [id]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hotel, setHotel] = useState<any | null>(null);
  const [roomCount, setRoomCount] = useState<number>(0);

  // edit state
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<{ name: string; address: string }>({ name: "", address: "" });

  useEffect(() => {
    if (!hotelId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const h = await hotelsService.get(hotelId);
        const rooms = await roomsService.list(hotelId);
        if (!mounted) return;
        setHotel(h);
        setRoomCount(Array.isArray(rooms) ? rooms.length : 0);
        setForm({ name: h?.name ?? "", address: h?.address ?? "" });
      } catch (e: any) {
        toast("error", "Failed to load hotel", e?.message);
        router.replace("/hotels");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [hotelId, router]);

  async function refresh() {
    if (!hotelId) return;
    const h = await hotelsService.get(hotelId);
    setHotel(h);
    setForm({ name: h?.name ?? "", address: h?.address ?? "" });
  }

  async function onSave() {
    if (!hotelId) return;
    if (!form.name.trim()) {
      toast("error", "Name is required");
      return;
    }
    try {
      setBusy(true);
      await hotelsService.update(hotelId, {
        name: form.name.trim(),
        address: form.address.trim() || undefined,
      });
      toast("success", "Hotel updated");
      await refresh();
      setEdit(false);
    } catch (e: any) {
      toast("error", "Update failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!hotelId) return;
    if (!confirm("Delete this hotel? This cannot be undone.")) return;
    try {
      setBusy(true);
      await hotelsService.remove(hotelId);
      toast("success", "Hotel deleted");
      router.replace("/hotels");
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

  if (!hotel) {
    return (
      <MainLayout>
        <div className="p-6 space-y-4">
          <button
            onClick={() => router.push("/hotels")}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-200">
            Hotel not found or access denied.
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
              onClick={() => router.push("/hotels")}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-sm">
                <Building2 size={18} />
              </div>
              <div>
                <div className="text-2xl font-bold">{hotel.name}</div>
                <div className="mt-0.5 text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={12} /> {hotel.address || "—"}
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
                  disabled={busy || !form.name.trim()}
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

        {/* Details card */}
        <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80">
          {edit ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div><span className="text-slate-500">Name:</span> <span className="font-medium">{hotel.name}</span></div>
              <div className="sm:col-span-2">
                <div className="text-slate-500">Address:</div>
                <div className="font-medium">{hotel.address || "—"}</div>
              </div>
              <div className="sm:col-span-2 mt-2 flex items-center gap-2 text-slate-600">
                <BedDouble size={16} /> Rooms in this hotel: <span className="font-semibold">{roomCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
