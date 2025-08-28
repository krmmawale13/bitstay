// apps/frontend/src/components/bookings/BookingForm.tsx
import { useEffect, useMemo, useState } from "react";
import bookingsService, {
  type CreateBookingInput,
} from "@/services/bookings.service";
import CustomerPicker from "@/components/forms/CustomerPicker";
import GuestsEditor from "@/components/bookings/GuestsEditor";
import { formatINR } from "@/utils/inr"; // if not present, replace with (v)=>`₹${Number(v||0)}`
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Loader2, UserPlus, DoorOpen } from "lucide-react";

/* ----------------------------- toast helper ----------------------------- */
function toast(
  type: "success" | "error" | "info",
  message: string,
  description?: string
) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  if (api?.push) api.push({ type, message, description });
  else console.log(`[toast:${type}]`, message, description ?? "");
}

/* ----------------------------- validation ------------------------------ */
const Schema = z.object({
  customerId: z.number().min(1, "Select a customer"),
  checkIn: z.string().min(1, "Check-in is required"),
  checkOut: z.string().min(1, "Check-out is required"),
  sourceId: z.number().optional().nullable(),
  hotelId: z.number().optional().nullable(), // UI helper; BE ignores on create
  rooms: z.array(z.number()).optional(),
  guests: z
    .array(
      z.object({
        name: z.string().min(1, "Guest name required"),
        idTypeId: z.number().optional().nullable(),
        idNumber: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export type BookingFormValues = z.infer<typeof Schema>;

/* ------------------------------- props --------------------------------- */
export default function BookingForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: Partial<CreateBookingInput>;
  onSuccess?: (created: any) => void;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(Schema) as any,
    defaultValues: {
      customerId: initial?.customerId,
      checkIn: initial?.checkIn || "",
      checkOut: initial?.checkOut || "",
      sourceId: initial?.sourceId ?? undefined,
      hotelId: initial?.hotelId ?? undefined,
      rooms: initial?.rooms || [],
      guests: initial?.guests || [],
    },
  });

  const checkIn = watch("checkIn");
  const checkOut = watch("checkOut");
  const hotelId = watch("hotelId");

  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [idTypes, setIdTypes] = useState<Array<{ id: number; name: string }>>(
    []
  );

  const [availLoading, setAvailLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<
    Array<{ id: number; number: string; rate?: number; type?: any; hotel?: any }>
  >([]);

  /* ------------------------------ effects ------------------------------ */
  // load meta for dropdowns (sources, idTypes)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setMetaLoading(true);
      setMetaError(null);
      try {
        const m = await bookingsService.getMeta();
        if (!mounted) return;
        setSources(m?.sources ?? []);
        setIdTypes(m?.idTypes ?? []);
      } catch (e: any) {
        setMetaError(e?.message || "Failed to load metadata");
      } finally {
        mounted && setMetaLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // fetch availability when dates change (and are valid)
  useEffect(() => {
    let mounted = true;
    const canCheck = checkIn && checkOut;
    if (!canCheck) {
      setAvailableRooms([]);
      return;
    }
    (async () => {
      setAvailLoading(true);
      try {
        const res = await bookingsService.availability({
          checkIn,
          checkOut,
          hotelId: hotelId ? Number(hotelId) : undefined,
        });
        if (!mounted) return;
        setAvailableRooms(res?.rooms ?? []);
      } catch (e: any) {
        toast("error", "Availability failed", e?.message);
        if (mounted) setAvailableRooms([]);
      } finally {
        mounted && setAvailLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [checkIn, checkOut, hotelId]);

  // compute selected rooms count
  const selectedRoomsCount = useMemo(() => {
    const selected = new Set(watch("rooms") || []);
    return selected.size;
  }, [watch("rooms")]);

  /* ------------------------------ actions ------------------------------ */
  async function onSubmit(values: BookingFormValues) {
    try {
      // BE expects rooms?: number[] and guests?: [...]
      const payload: CreateBookingInput = {
        customerId: values.customerId!,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        sourceId: values.sourceId ?? undefined,
        hotelId: values.hotelId ?? undefined, // FYI: BE ignores; only availability uses it
        rooms: values.rooms && values.rooms.length ? values.rooms : undefined,
        guests: values.guests && values.guests.length ? values.guests : undefined,
      };
      const created = await bookingsService.create(payload);
      toast("success", "Booking created");
      onSuccess?.(created);
    } catch (e: any) {
      toast("error", "Create failed", e?.message || "Something went wrong");
    }
  }

  /* ------------------------------- UI --------------------------------- */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section: Primary details */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center">
            <CalendarDays size={16} />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            Booking Details
          </h2>
        </div>

        {/* Customer + Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer */}
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <CustomerPicker
              value={watch("customerId") || undefined}
              onChange={(id) => setValue("customerId", id || 0, { shouldValidate: true })}
              placeholder="Search or quick-create customer"
            />
            {errors.customerId && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.customerId.message as string}
              </p>
            )}
          </div>

          {/* Check-in */}
          <div>
            <label className="block text-sm font-medium mb-1">Check-in</label>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              {...register("checkIn")}
            />
            {errors.checkIn && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.checkIn.message as string}
              </p>
            )}
          </div>

          {/* Check-out */}
          <div>
            <label className="block text-sm font-medium mb-1">Check-out</label>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              {...register("checkOut")}
            />
            {errors.checkOut && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.checkOut.message as string}
              </p>
            )}
          </div>
        </div>

        {/* Source + Hotel (filter) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <select
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              {...register("sourceId", { valueAsNumber: true })}
              defaultValue={initial?.sourceId ?? ""}
            >
              <option value="">Select...</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Hotel (filter rooms)
            </label>
            <input
              type="number"
              placeholder="Optional: Hotel ID"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              {...register("hotelId", { valueAsNumber: true })}
            />
          </div>
        </div>
      </section>

      {/* Section: Rooms (availability) */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Available Rooms</h2>
          <div className="text-xs text-slate-500">
            Selected: <b>{selectedRoomsCount}</b>
          </div>
        </div>

        {!(checkIn && checkOut) ? (
          <div className="text-sm text-slate-500">
            Select check-in & check-out to load availability.
          </div>
        ) : availLoading ? (
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={16} /> Checking availability…
          </div>
        ) : availableRooms.length === 0 ? (
          <div className="text-sm text-slate-500">
            No rooms available for selected window.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableRooms.map((r) => {
              const selected = (watch("rooms") || []).includes(r.id);
              return (
                <label
                  key={r.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                    selected
                      ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <DoorOpen size={16} />
                    </div>
                    <div>
                      <div className="font-medium">Room #{r.number}</div>
                      <div className="text-xs text-slate-500">
                        {r.type?.name ? `${r.type.name} • ` : ""}
                        {r.hotel?.name ? `${r.hotel.name} • ` : ""}
                        {formatINR(r.rate ?? 0)}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selected}
                    onChange={(e) => {
                      const cur = new Set(watch("rooms") || []);
                      if (e.target.checked) cur.add(r.id);
                      else cur.delete(r.id);
                      setValue("rooms", Array.from(cur));
                    }}
                  />
                </label>
              );
            })}
          </div>
        )}
      </section>

      {/* Section: Guests */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            <UserPlus size={16} />
          </div>
        <h2 className="font-semibold">Guests</h2>
        </div>
        {metaLoading && !metaError ? (
          <div className="text-sm text-slate-500">
            Loading metadata (ID types)…
          </div>
        ) : metaError ? (
          <div className="text-sm text-rose-600">{metaError}</div>
        ) : (
          <GuestsEditor
            value={watch("guests") || []}
            idTypes={idTypes}
            onChange={(v) => setValue("guests", v)}
          />
        )}
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onCancel?.()}
          className="rounded-lg px-4 py-2 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 shadow-sm"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
          Save Booking
        </button>
      </div>
    </form>
  );
}
