// apps/frontend/src/pages/hotels/[id]/edit.tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import { hotelsService, roomsService } from "@/services/property.service";
import {
  ArrowLeft,
  Building2,
  Save,
  BedSingle,
  Pencil,
  Check,
  X,
  Plus,
  RefreshCcw,
  Loader2,
} from "lucide-react";

/* toast bridge */
function toast(
  type: "success" | "error" | "info",
  message: string,
  description?: string
) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push
    ? api.push({ type, message, description })
    : console.log(`[toast:${type}]`, message, description ?? "");
}

/* helpers */
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
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
  const [rooms, setRooms] = useState<any[]>([]);

  // edit state
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<{ name: string; address?: string }>({
    name: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // load hotel + its rooms
  useEffect(() => {
    if (!hotelId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [h, rs] = await Promise.all([
          hotelsService.get(hotelId),
          roomsService.list(hotelId),
        ]);
        if (!mounted) return;
        setHotel(h);
        setForm({ name: h?.name ?? "", address: h?.address ?? "" });
        setRooms(Array.isArray(rs) ? rs : []);
      } catch (e: any) {
        toast("error", "Failed to load hotel", e?.message);
        router.replace("/hotels");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [hotelId, router]);

  async function refreshRooms() {
    if (!hotelId) return;
    try {
      const rs = await roomsService.list(hotelId);
      setRooms(Array.isArray(rs) ? rs : []);
    } catch {
      // ignore
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    else if (form.name.trim().length > 100)
      errs.name = "Name must be ≤ 100 characters";
    return errs;
  }

  async function onSave() {
    if (!hotelId) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast("error", "Please fix validation errors");
      return;
    }
    try {
      setBusy(true);
      await hotelsService.update(hotelId, {
        name: form.name.trim(),
        address: form.address?.trim() || undefined,
      });
      toast("success", "Hotel updated");
      const fresh = await hotelsService.get(hotelId);
      setHotel(fresh);
      setForm({ name: fresh?.name ?? "", address: fresh?.address ?? "" });
      setEdit(false);
    } catch (e: any) {
      toast("error", "Update failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  if (!router.isReady || loading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6 animate-pulse">
          <div className="h-9 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
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
                <div className="text-sm text-slate-500">
                  Created {fmtDate(hotel.createdAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {edit ? (
              <>
                <button
                  onClick={() => setEdit(false)}
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
                  {busy ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setEdit(true)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500"
              >
                <Pencil size={16} />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Hotel card (view/edit) */}
        <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80">
          {edit ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={cls(
                    "mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300",
                    errors.name
                      ? "border-rose-400 dark:border-rose-500"
                      : "border-slate-300 dark:border-slate-700",
                    "bg-white dark:bg-slate-900"
                  )}
                />
                {errors.name && (
                  <div className="mt-1 text-xs text-rose-600 dark:text-rose-300">
                    {errors.name}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <textarea
                  value={form.address || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-2 text-sm">
              <div>
                <span className="text-slate-500">Name:</span>{" "}
                <span className="font-medium">{hotel.name}</span>
              </div>
              <div>
                <span className="text-slate-500">Address:</span>{" "}
                <span className="font-medium">
                  {hotel.address || "—"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Rooms under this hotel */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="font-semibold">Rooms</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refreshRooms()}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
                title="Refresh"
              >
                <RefreshCcw size={14} />
                Refresh
              </button>
              <button
                onClick={() =>
                  router.push(`/rooms/create?hotelId=${hotelId}`)
                }
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-500"
              >
                <Plus size={14} />
                Add Room
              </button>
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No rooms yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <colgroup>
                  <col className="w-[80px]" />
                  <col className="w-[120px]" />
                  <col className="w-[160px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                  <col className="w-[140px]" />
                </colgroup>
                <thead className="bg-slate-50/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 backdrop-blur">
                  <tr>
                    <Th>ID</Th>
                    <Th>Room</Th>
                    <Th>Type</Th>
                    <Th className="text-right">Rate</Th>
                    <Th>Status</Th>
                    <Th className="text-center">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rooms.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <Td>#{r.id}</Td>
                      <Td className="font-mono">{r.number}</Td>
                      <Td>{r.type?.name ?? "—"}</Td>
                      <Td className="text-right">
                        {r.rate ? `₹${r.rate}` : "—"}
                      </Td>
                      <Td>
                        <StatusChip status={r.status} />
                      </Td>
                      <Td className="text-center">
                        <button
                          onClick={() => router.push(`/rooms/${r.id}/edit`)}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white
                                     bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-500"
                        >
                          <BedSingle size={16} /> View
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

/* ---------- tiny cells ---------- */
function Th({
  children,
  className = "",
  ...rest
}: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  return (
    <th
      {...rest}
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...rest} className={`px-4 py-3 align-middle ${className}`}>
      {children}
    </td>
  );
}

/* ---------- status chip ---------- */
function StatusChip({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    CLEAN: {
      cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800",
      label: "Clean",
    },
    DIRTY: {
      cls: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-800",
      label: "Dirty",
    },
    INSPECT: {
      cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800",
      label: "Inspect",
    },
    OOO: {
      cls: "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:ring-slate-700",
      label: "OOO",
    },
  };
  const s = map[status] || map.CLEAN;
  return (
    <span
      className={cls(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ring-1",
        s.cls
      )}
    >
      <Check size={14} />
      {s.label}
    </span>
  );
}
