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
  Info,
} from "lucide-react";

/* ------------------------- toast helper ------------------------- */
function notify(
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

/* ------------------------- small utils ------------------------- */
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
  return Math.ceil(diff / 86400000);
}

/* ------------------------------ page ------------------------------ */
export default function BookingCreatePage() {
  const router = useRouter();

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
        notify("error", "Failed to load metadata", e?.message);
      } finally {
        setMetaLoading(false);
      }
    })();
  }, []);

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
      });
      setRooms(res.rooms || []);
      const ids = new Set((res.rooms || []).map((r: any) => r.id));
      setSelectedRooms((prev) => prev.filter((id) => ids.has(id)));
      if ((res.rooms || []).length === 0) {
        notify("info", "No rooms available");
      } else {
        notify("success", "Availability updated");
      }
    } catch (e: any) {
      notify("error", "Availability check failed", e?.message);
    } finally {
      setCheckingAvail(false);
    }
  }

  function toggleRoom(id: number) {
    setSelectedRooms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
      notify("error", "Select at least one room");
      return;
    }

    const payload: CreateBookingInput = {
      customerId,
      checkIn,
      checkOut,
      sourceId: typeof sourceId === "number" ? sourceId : undefined,
      rooms: selectedRooms,
      guests: guests.length ? guests : undefined,
    };

    setSaving(true);
    try {
      const created = await bookingsService.create(payload);
      notify("success", "Booking created");
      router.push(`/bookings/${created.id}`);
    } catch (e: any) {
      notify("error", "Create failed", e?.message);
    } finally {
      setSaving(false);
    }
  }

  const nights = daysBetween(checkIn, checkOut);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
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
                Select customer, dates, and rooms.
              </p>
            </div>
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
                  Walk-in? Quick create inside picker.
                </p>
              </section>

              {/* Dates & source */}
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">
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
                    <label className="block text-xs font-medium mb-1">
                      Check-out
                    </label>
                    <input
                      type="datetime-local"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end text-sm">
                    Nights: <span className="ml-1 font-semibold">{nights}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
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

                <button
                  onClick={checkAvailability}
                  disabled={checkingAvail}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:ring-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <BedDouble size={16} />
                  {checkingAvail ? "Checking…" : "Check availability"}
                </button>
              </section>

              {/* Available rooms */}
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BedDouble size={16} className="text-slate-500" />
                  <div className="text-sm font-medium">Available Rooms</div>
                </div>
                {rooms.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No rooms fetched yet.
                  </div>
                ) : (
                  <ul className="grid md:grid-cols-2 gap-3">
                    {rooms.map((r: any) => {
                      const active = selectedRooms.includes(r.id);
                      return (
                        <li
                          key={r.id}
                          onClick={() => toggleRoom(r.id)}
                          className={cls(
                            "cursor-pointer rounded-xl border p-3 text-sm transition",
                            active
                              ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/40"
                              : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                          )}
                        >
                          <div className="font-medium">
                            Room #{r.number ?? r.id}
                          </div>
                          <div className="text-xs text-slate-500">
                            {r.type?.name ?? "—"} • {r.hotel?.name ?? "—"}{" "}
                            {typeof r.rate === "number" ? `• ₹${r.rate}` : ""}
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
                            {g.idTypeId
                              ? `ID Type #${g.idTypeId}`
                              : "ID: —"}{" "}
                            {g.idNumber ? `• ${g.idNumber}` : ""}
                          </div>
                        </div>
                        <button
                          onClick={() => removeGuest(idx)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white bg-rose-600 hover:bg-rose-500"
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
                  <input
                    value={guestDraft.name}
                    onChange={(e) =>
                      setGuestDraft((g) => ({ ...g, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    placeholder="Guest name"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={guestDraft.idTypeId ?? ""}
                      onChange={(e) =>
                        setGuestDraft((g) => ({
                          ...g,
                          idTypeId: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        }))
                      }
                      disabled={metaLoading}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    >
                      <option value="">ID Type</option>
                      {idTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={guestDraft.idNumber ?? ""}
                      onChange={(e) =>
                        setGuestDraft((g) => ({
                          ...g,
                          idNumber: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      placeholder="ID number"
                    />
                  </div>

                  <button
                    onClick={addGuest}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:ring-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <Plus size={14} />
                    Add guest
                  </button>
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
              disabled={saving}
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
