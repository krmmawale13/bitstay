import { useEffect, useMemo, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import bookingsService, { CreateBookingInput, BookingGuestInput } from "@/services/bookings.service";
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
} from "lucide-react";
import { useRouter } from "next/router";

/* toast (same as other pages) */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

/* RBAC */
function usePerms() {
  const [perms, setPerms] = useState<string[]>([]);
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("permissions");
        const arr = raw ? JSON.parse(raw) : [];
        setPerms(Array.isArray(arr) ? arr.map(String) : []);
      } catch { setPerms([]); }
    };
    load();
    window.addEventListener("permissions:updated", load);
    return () => window.removeEventListener("permissions:updated", load);
  }, []);
  const has = (p: string | string[]) => {
    const want = Array.isArray(p) ? p : [p];
    return want.some((w) => perms.includes(w));
  };
  return { has };
}

/* utils */
function isoLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function daysBetween(a?: string, b?: string) {
  if (!a || !b) return 0;
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (!Number.isFinite(A) || !Number.isFinite(B)) return 0;
  const diff = Math.max(0, B - A);
  return Math.ceil(diff / 86400000);
}

export default function BookingCreatePage() {
  const router = useRouter();
  const { has } = usePerms();
  const canCreate = has(["booking.create", "bookings.create", "BOOKINGS_CREATE"]);

  // meta
  const [metaLoading, setMetaLoading] = useState(true);
  const [sources, setSources] = useState<{ id: number; name: string }[]>([]);
  const [idTypes, setIdTypes] = useState<{ id: number; name: string }[]>([]);

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

  // availability
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);

  // guests
  const [guests, setGuests] = useState<BookingGuestInput[]>([]);
  const [guestDraft, setGuestDraft] = useState<BookingGuestInput>({
    name: "",
    idTypeId: undefined,
    idNumber: "",
  });

  // submit busy
  const [saving, setSaving] = useState(false);

  // load meta
  useEffect(() => {
    (async () => {
      setMetaLoading(true);
      try {
        const m = await bookingsService.getMeta();
        setSources(m?.sources ?? []);
        setIdTypes(m?.idTypes ?? []);
      } catch (e: any) {
        toast("error", "Failed to load metadata", e?.message);
      } finally {
        setMetaLoading(false);
      }
    })();
  }, []);

  async function checkAvailability() {
    if (!checkIn || !checkOut) return toast("error", "Select check-in and check-out");
    if (new Date(checkOut) <= new Date(checkIn)) return toast("error", "Check-out must be after check-in");

    setCheckingAvail(true);
    try {
      const res = await bookingsService.availability({
        checkIn,
        checkOut,
        hotelId: typeof hotelId === "number" ? hotelId : undefined,
      });
      setRooms(res.rooms || []);
      // keep previous selections that still exist
      const ids = new Set((res.rooms || []).map((r: any) => r.id));
      setSelectedRooms((prev) => prev.filter((id) => ids.has(id)));
      toast(res.rooms?.length ? "success" : "info", res.rooms?.length ? "Availability updated" : "No rooms in selected window");
    } catch (e: any) {
      toast("error", "Availability check failed", e?.message);
    } finally {
      setCheckingAvail(false);
    }
  }

  function toggleRoom(id: number) {
    setSelectedRooms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addGuest() {
    if (!guestDraft.name?.trim()) {
      toast("error", "Guest name is required");
      return;
    }
    setGuests((g) => [...g, guestDraft]);
    setGuestDraft({ name: "", idTypeId: undefined, idNumber: "" });
  }
  function removeGuest(idx: number) {
    setGuests((g) => g.filter((_, i) => i !== idx));
  }

  async function onSubmit() {
    if (!canCreate) {
      toast("error", "You do not have permission to create bookings");
      return;
    }
    // minimal validation
    if (!customerId) return toast("error", "Select a customer");
    if (!checkIn || !checkOut) return toast("error", "Select check-in and check-out");
    if (new Date(checkOut) <= new Date(checkIn)) return toast("error", "Check-out must be after check-in");
    if (selectedRooms.length === 0) return toast("error", "Select at least one available room");

    const payload: CreateBookingInput = {
      customerId,
      checkIn,
      checkOut,
      sourceId: typeof sourceId === "number" ? sourceId : undefined,
      hotelId: typeof hotelId === "number" ? hotelId : undefined, // just a filter; backend alloc uses rooms[]
      rooms: selectedRooms,
      guests: guests.length ? guests : undefined,
    };

    setSaving(true);
    try {
      const created = await bookingsService.create(payload);
      toast("success", "Booking created");
      router.push(`/bookings/${created.id}`);
    } catch (e: any) {
      toast("error", "Create failed", e?.message);
    } finally {
      setSaving(false);
    }
  }

  const nights = daysBetween(checkIn, checkOut);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => router.push("/bookings")}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm
                       bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <CalendarDays size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                New Booking
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Select customer, dates, and allocate rooms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSubmit}
              disabled={saving || !canCreate}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                         shadow-sm active:scale-[0.98] disabled:opacity-60"
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
                <CustomerPicker
                  value={customerId}
                  onChange={(id) => setCustomerId(id)}
                />
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                  <Info size={12} />
                  Walk-in? Quick create from picker — you don’t need to leave this page.
                </p>
              </section>

              {/* Dates & source */}
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Check-in
                    </label>
                    <input
                      type="datetime-local"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
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
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      Nights: <span className="font-semibold">{nights}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Source
                    </label>
                    <select
                      value={sourceId}
                      onChange={(e) =>
                        setSourceId(e.target.value ? Number(e.target.value) : "")
                      }
                      disabled={metaLoading}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
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
                        onChange={(e) =>
                          setHotelId(e.target.value ? Number(e.target.value) : "")
                        }
                        placeholder="Hotel ID (if you want to filter)"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-2 text-sm"
                      />
                      <Building2
                        size={16}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={checkAvailability}
                    disabled={checkingAvail}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200
                               bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
                  >
                    <BedDouble size={16} />
                    {checkingAvail ? "Checking…" : "Check availability"}
                  </button>
                </div>
              </section>

              {/* Available rooms */}
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BedDouble size={16} className="text-slate-500" />
                  <div className="text-sm font-medium">Available Rooms</div>
                </div>
                {rooms.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No rooms fetched yet. Click “Check availability”.
                  </div>
                ) : (
                  <ul className="grid md:grid-cols-2 gap-3">
                    {rooms.map((r: any) => {
                      const active = selectedRooms.includes(r.id);
                      return (
                        <li
                          key={r.id}
                          onClick={() => toggleRoom(r.id)}
                          className={`cursor-pointer rounded-xl border p-3 text-sm transition ${
                            active
                              ? "border-blue-300 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800"
                              : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="font-medium">Room #{r.number ?? r.id}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {r.type?.name ? `Type: ${r.type.name}` : "Type: —"}
                            {r.hotel?.name ? ` • Hotel: ${r.hotel.name}` : ""}
                            {typeof r.rate === "number" ? ` • Rate: ₹${r.rate}` : ""}
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

                {/* list */}
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
                  <div className="text-xs text-slate-500 mb-2">Add primary guest details:</div>
                )}

                {/* add form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs mb-1">Guest name</label>
                    <input
                      value={guestDraft.name}
                      onChange={(e) => setGuestDraft((g) => ({ ...g, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
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
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
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
                        onChange={(e) => setGuestDraft((g) => ({ ...g, idNumber: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                        placeholder="ID number"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={addGuest}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:ring-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      <Plus size={14} />
                      Add guest
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-xs text-slate-500">
                  After saving, you can add charges and payments from the booking detail page.
                </div>
              </section>
            </div>
          </div>

          {/* footer bar */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 p-4">
            <button
              onClick={() => router.push("/bookings")}
              className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={saving || !canCreate}
              className="rounded-lg px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Booking"}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
