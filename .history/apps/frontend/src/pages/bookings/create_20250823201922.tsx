// apps/frontend/src/pages/bookings/create.tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import bookingsService, {
  CreateBookingInput,
  BookingGuestInput,
} from "@/services/bookings.service";
import CustomerPicker from "@/components/forms/CustomerPicker";
import {
  ArrowLeft,
  CalendarDays,
  BedDouble,
  Users,
  Plus,
  Trash2,
  Building2,
  Info,
  Filter,
  RefreshCcw,
} from "lucide-react";

/* ---------------- toast helper ---------------- */
function notify(
  type: "success" | "error" | "info",
  message: string,
  opts?: { description?: string }
) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  if (api?.push) api.push({ type, message, description: opts?.description });
  else console.log(`[toast:${type}] ${message}`, opts?.description ?? "");
}

/* ---------------- tiny utils ---------------- */
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function isoLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}
function daysBetween(a?: string, b?: string) {
  if (!a || !b) return 0;
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (!Number.isFinite(A) || !Number.isFinite(B)) return 0;
  const diff = Math.max(0, B - A);
  return Math.max(1, Math.ceil(diff / 86400000)); // min 1 for estimate
}

/* ---------------- types (FE-side shape from meta) ---------------- */
type Source = { id: number; name: string };
type IdType = { id: number; name: string };
type GstSlab = { id: number; name: string; hsn?: string | null; ratePercent: number };

type RoomItem = {
  id: number;
  number?: string | number | null;
  rate?: number | null;
  hsn?: string | null; // if BE returns on room
  type?: { id: number; name: string; hsn?: string | null } | null;
  hotel?: { id: number; name: string } | null;
};

/* ---------------- page ---------------- */
export default function BookingCreatePage() {
  const router = useRouter();

  // meta
  const [metaLoading, setMetaLoading] = useState(true);
  const [sources, setSources] = useState<Source[]>([]);
  const [idTypes, setIdTypes] = useState<IdType[]>([]);
  const [gstSlabs, setGstSlabs] = useState<GstSlab[]>([]);

  // form state
  const now = useMemo(() => isoLocal(new Date()), []);
  const twoHoursLater = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return isoLocal(d);
  }, []);

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [sourceId, setSourceId] = useState<number | "">("");
  const [hotelId, setHotelId] = useState<number | "">("");

  const [checkIn, setCheckIn] = useState<string>(now);
  const [checkOut, setCheckOut] = useState<string>(twoHoursLater);
  const nights = daysBetween(checkIn, checkOut);

  // availability
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("");

  // guests
  const [guests, setGuests] = useState<BookingGuestInput[]>([]);
  const [guestDraft, setGuestDraft] = useState<BookingGuestInput>({
    name: "",
    idTypeId: undefined,
    idNumber: "",
  });

  const [saving, setSaving] = useState(false);

  // load meta
  useEffect(() => {
    (async () => {
      setMetaLoading(true);
      try {
        const m = await bookingsService.getMeta();
        setSources(m?.sources ?? []);
        setIdTypes(m?.idTypes ?? []);
        setGstSlabs((m as any)?.gstSlabs ?? []); // optional
      } catch (e: any) {
        notify("error", "Failed to load metadata", { description: e?.message });
      } finally {
        setMetaLoading(false);
      }
    })();
  }, []);

  // availability
  async function checkAvailability() {
    if (!checkIn || !checkOut) {
      notify("error", "Select check-in and check-out");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      notify("error", "Check-out must be after check-in");
      return;
    }
    setCheckingAvail(true);
    try {
      const res = await bookingsService.availability({
        checkIn,
        checkOut,
        hotelId: typeof hotelId === "number" ? hotelId : undefined,
      });
      const list = (res.rooms || []) as RoomItem[];
      setRooms(list);
      // keep only still-available selections
      const ids = new Set(list.map((r) => r.id));
      setSelectedRooms((prev) => prev.filter((id) => ids.has(id)));
      if (list.length === 0) notify("info", "No rooms available in selected window");
      else notify("success", "Availability updated");
    } catch (e: any) {
      notify("error", "Availability check failed", { description: e?.message });
    } finally {
      setCheckingAvail(false);
    }
  }

  function toggleRoom(id: number) {
    setSelectedRooms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addGuest() {
    if (!guestDraft.name?.trim()) {
      notify("error", "Guest name is required");
      return;
    }
    setGuests((g) => [...g, guestDraft]);
    setGuestDraft({ name: "", idTypeId: undefined, idNumber: "" });
  }
  function removeGuest(idx: number) {
    setGuests((g) => g.filter((_, i) => i !== idx));
  }

  // GST helper: find rate by HSN
  function getGstRateForHSN(hsn?: string | null): number {
    if (!hsn) return 0;
    const slab = gstSlabs.find((s) => s.hsn && s.hsn === hsn);
    return slab?.ratePercent ?? 0;
  }

  // estimate based on selected rooms with per-room HSN GST
  const estimate = useMemo(() => {
    // base = sum(room.rate) * nights
    let basePerNight = 0;
    let gstPerNight = 0;

    for (const id of selectedRooms) {
      const r = rooms.find((x) => x.id === id);
      const rate = Number(r?.rate ?? 0);
      basePerNight += rate;

      // HSN priority: room.hsn -> room.type?.hsn
      const hsn = (r?.hsn ?? r?.type?.hsn) || undefined;
      const ratePct = getGstRateForHSN(hsn);
      gstPerNight += Math.round((rate * ratePct) / 100);
    }

    const base = basePerNight * Math.max(1, nights);
    const gst = gstPerNight * Math.max(1, nights);
    const total = base + gst;
    return { base, gst, total };
  }, [selectedRooms, rooms, nights, gstSlabs]);

  async function onSubmit() {
    if (!customerId) {
      notify("error", "Select a customer");
      return;
    }
    if (!checkIn || !checkOut) {
      notify("error", "Select check-in and check-out");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      notify("error", "Check-out must be after check-in");
      return;
    }
    if (selectedRooms.length === 0) {
      notify("error", "Select at least one available room");
      return;
    }

    const payload: CreateBookingInput = {
      customerId,
      checkIn,
      checkOut,
      sourceId: typeof sourceId === "number" ? sourceId : undefined,
      hotelId: typeof hotelId === "number" ? hotelId : undefined,
      rooms: selectedRooms,
      guests: guests.length ? guests : undefined,
    };

    setSaving(true);
    try {
      const created = await bookingsService.create(payload);
      notify("success", "Booking created");
      router.push(`/bookings/${created.id}`);
    } catch (e: any) {
      notify("error", "Create failed", { description: e?.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
              title="Back"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm ml-2">
              <CalendarDays size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">New Booking</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Walk-in supported via the customer picker. Dates & availability below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSubmit}
              disabled={saving}
              className={cls(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white",
                "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500",
                "shadow-sm active:scale-[0.98] disabled:opacity-60"
              )}
            >
              {saving ? "Saving…" : "Save Booking"}
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <div className="p-6 grid gap-6 lg:grid-cols-3">
            {/* Left: basics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer */}
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-sm font-medium mb-2">Customer</div>
                <CustomerPicker value={customerId} onChange={(id) => setCustomerId(id)} />
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                  <Info size={12} />
                  Walk-in? Use quick create in the picker — no need to leave this page.
                </p>
              </section>

              {/* Dates & filters (realigned) */}
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                {/* Row 1: dates + nights pill */}
                <div className="grid md:grid-cols-[1fr,1fr,auto] gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Check-in
                    </label>
                    <input
                      type="datetime-local"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Check-out
                    </label>
                    <input
                      type="datetime-local"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-blue-200 dark:ring-blue-800 bg-gradient-to-br from-blue-50/60 to-transparent dark:from-blue-900/20">
                      Nights: <span className="font-semibold">{nights}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: source / hotel / actions */}
                <div className="mt-4 grid md:grid-cols-[1fr,1fr,auto] gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Source
                    </label>
                    <select
                      value={sourceId}
                      onChange={(e) => setSourceId(e.target.value ? Number(e.target.value) : "")}
                      disabled={metaLoading}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {sources.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Hotel (optional filter)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={hotelId}
                        onChange={(e) => setHotelId(e.target.value ? Number(e.target.value) : "")}
                        placeholder="Hotel ID"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-2 text-sm"
                      />
                      <Building2
                        size={16}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={checkAvailability}
                      disabled={checkingAvail}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
                    >
                      <BedDouble size={16} />
                      {checkingAvail ? "Checking…" : "Check availability"}
                    </button>
                    <button
                      onClick={() => {
                        setRooms([]);
                        setSelectedRooms([]);
                        setTypeFilter("");
                      }}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                      title="Reset availability"
                    >
                      <RefreshCcw size={16} />
                      Reset
                    </button>
                  </div>
                </div>
              </section>

              {/* Available rooms */}
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BedDouble size={16} className="text-slate-500" />
                    <div className="text-sm font-medium">Available Rooms</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
                      title="Filter by type"
                    >
                      <option value="">Type: All</option>
                      {[...new Set(rooms.map((r) => r.type?.name).filter(Boolean))].map((t) => (
                        <option key={t as string} value={t as string}>
                          {t as string}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {rooms.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No rooms fetched yet. Click “Check availability”.
                  </div>
                ) : (
                  <ul className="grid md:grid-cols-2 gap-3">
                    {rooms
                      .filter((r) => (typeFilter ? r.type?.name === typeFilter : true))
                      .map((r) => {
                        const active = selectedRooms.includes(r.id);
                        const hsn = r.hsn ?? r.type?.hsn;
                        const gstRate = hsn ? `${getGstRateForHSN(hsn)}% GST` : "GST: —";
                        return (
                          <li
                            key={r.id}
                            onClick={() => toggleRoom(r.id)}
                            className={cls(
                              "cursor-pointer rounded-xl border p-3 text-sm transition relative overflow-hidden",
                              active
                                ? "border-blue-300 bg-gradient-to-br from-blue-50/60 to-transparent dark:from-blue-900/30 dark:border-blue-800"
                                : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Room #{r.number ?? r.id}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {r.type?.name ? `Type: ${r.type.name}` : "Type: —"}
                                  {r.hotel?.name ? ` • Hotel: ${r.hotel.name}` : ""}
                                  {typeof r.rate === "number" ? ` • Rate: ₹${r.rate}` : ""}
                                  {` • ${gstRate}`}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </section>
            </div>

            {/* Right: Guests */}
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-slate-500" />
                  <div className="text-sm font-medium">Guests</div>
                </div>

                {guests.length ? (
                  <ul className="mb-3 space-y-2">
                    {guests.map((g, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="text-sm">
                          <div className="font-medium">{g.name}</div>
                          <div className="text-xs text-slate-500">
                            {g.idTypeId ? `ID Type #${g.idTypeId}` : "ID: —"}
                            {g.idNumber ? ` • No: ${g.idNumber}` : ""}
                          </div>
                        </div>
                        <button
                          onClick={() => removeGuest(idx)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white bg-rose-600 hover:bg-rose-500"
                          title="Remove"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-500 mb-2">
                    Add primary guest details:
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs mb-1">Guest name</label>
                    <input
                      value={guestDraft.name}
                      onChange={(e) =>
                        setGuestDraft((g) => ({ ...g, name: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      placeholder="Full name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1">ID Type</label>
                      <select
                        value={guestDraft.idTypeId ?? ""}
                        onChange={(e) =>
                          setGuestDraft((g) => ({
                            ...g,
                            idTypeId: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        disabled={metaLoading}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      >
                        <option value="">—</option>
                        {idTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">ID Number</label>
                      <input
                        value={guestDraft.idNumber ?? ""}
                        onChange={(e) =>
                          setGuestDraft((g) => ({ ...g, idNumber: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                        placeholder="ID number"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={addGuest}
                      className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:ring-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      <Plus size={14} />
                      Add guest
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-xs text-slate-500">
                  After saving, add charges/payments on the booking detail page.
                </div>
              </section>
            </div>
          </div>

          {/* sticky preview bar */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 p-4 sticky bottom-0 bg-white/80 backdrop-blur dark:bg-slate-900/80">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 ring-1 ring-slate-200 dark:ring-slate-700">
                Rooms selected: <strong>{selectedRooms.length}</strong>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 ring-1 ring-slate-200 dark:ring-slate-700">
                Nights: <strong>{nights}</strong>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 ring-1 ring-slate-200 dark:ring-slate-700">
                Est. Base: <strong>₹{estimate.base.toLocaleString()}</strong>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 ring-1 ring-slate-200 dark:ring-slate-700">
                Est. GST: <strong>₹{estimate.gst.toLocaleString()}</strong>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 ring-2 ring-blue-200 dark:ring-blue-800 bg-gradient-to-br from-blue-50/60 to-transparent dark:from-blue-900/20">
                Est. Total: <strong>₹{estimate.total.toLocaleString()}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="rounded-xl px-3 py-1.5 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                onClick={onSubmit}
                disabled={saving}
                className={cls(
                  "rounded-xl px-4 py-2 text-sm text-white",
                  "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500",
                  "shadow-sm disabled:opacity-60"
                )}
              >
                {saving ? "Saving…" : "Save Booking"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
