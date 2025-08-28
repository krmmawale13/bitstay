import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import bookingsService from "@/services/bookings.service";
import { z } from "zod";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type Meta = {
  sources: { id: number; name: string }[];
  paymentModes: { id: number; mode: string }[];
};

// helpers to coerce number fields ("" -> undefined, string -> number)
const toOptionalInt = () =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().positive().optional()
  );

const toIntArray = () =>
  z
    .array(
      z.preprocess((v) => Number(v), z.number().int().positive())
    )
    .optional();

const GuestSchema = z.object({
  name: z.string().min(1, "Name required"),
  idTypeId: toOptionalInt(),
  idNumber: z.string().optional(),
});

const schema = z.object({
  customerId: z.preprocess((v) => Number(v), z.number().int().positive({ message: "Customer is required" })),
  checkIn: z.string().min(1, "Check-in is required"),
  checkOut: z.string().min(1, "Check-out is required"),
  sourceId: toOptionalInt(),
  hotelId: toOptionalInt(), // only for availability query
  rooms: toIntArray(),
  guests: z.array(GuestSchema).optional(),
});

type FormValues = z.infer<typeof schema>;

const cx = (...cls: (string | false | null | undefined)[]) => cls.filter(Boolean).join(" ");

export default function CreateBookingPage() {
  const router = useRouter();

  // ---- Load metadata (sources, modes) ----
  const [meta, setMeta] = useState<Meta>({ sources: [], paymentModes: [] });
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoadingMeta(true);
        const m = await bookingsService.getMeta();
        setMeta(m);
      } catch (e: any) {
        (window as any).__toast?.push?.({
          type: "error",
          message: "Couldn’t load metadata",
          description: e?.response?.data?.message || e?.message || "Try again.",
        });
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  // ---- Form ----
  const now = new Date();
  const todayISO = now.toISOString();
  const tomorrowISO = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    control,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: undefined as unknown as number,
      checkIn: todayISO.slice(0, 16),  // yyyy-MM-ddTHH:mm
      checkOut: tomorrowISO.slice(0, 16),
      sourceId: undefined,
      hotelId: undefined,
      rooms: [],
      guests: [{ name: "" }],
    },
    mode: "onBlur",
  });

  const { fields: guestFields, append: addGuest, remove: removeGuest } = useFieldArray({ control, name: "guests" });

  const watchCheckIn = watch("checkIn");
  const watchCheckOut = watch("checkOut");
  const watchHotelId = watch("hotelId");

  // ---- Availability ----
  const [roomsAvail, setRoomsAvail] = useState<{ id: number; number: string }[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const canQueryAvail = useMemo(() => Boolean(watchCheckIn && watchCheckOut), [watchCheckIn, watchCheckOut]);

  const fetchAvailability = async () => {
    if (!canQueryAvail) return;
    try {
      setLoadingAvail(true);
      const { rooms } = await bookingsService.availability({
        checkIn: new Date(watchCheckIn).toISOString(),
        checkOut: new Date(watchCheckOut).toISOString(),
        hotelId: watchHotelId,
      });
      setRoomsAvail(rooms as any);
      (window as any).__toast?.push?.({
        type: "info",
        message: "Availability refreshed",
        description: `${rooms?.length || 0} rooms available`,
      });
    } catch (e: any) {
      (window as any).__toast?.push?.({
        type: "error",
        message: "Couldn’t load availability",
        description: e?.response?.data?.message || e?.message || "Try again.",
      });
    } finally {
      setLoadingAvail(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { if (canQueryAvail) fetchAvailability(); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchCheckIn, watchCheckOut, watchHotelId]);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      const payload = {
        customerId: values.customerId,
        checkIn: new Date(values.checkIn).toISOString(),
        checkOut: new Date(values.checkOut).toISOString(),
        sourceId: values.sourceId,
        rooms: values.rooms && values.rooms.length ? values.rooms : undefined,
        guests:
          values.guests
            ?.map((g) => ({
              name: g.name,
              idTypeId: g.idTypeId,
              idNumber: g.idNumber || undefined,
            }))
            .filter((g) => (g.name || "").trim().length) || undefined,
      };

      const created = await bookingsService.create(payload as any);
      (window as any).__toast?.push?.({
        type: "success",
        message: "Booking created",
        description: `Booking #${created?.id || ""} saved.`,
      });
      router.push(`/bookings/${created?.id ?? ""}`);
    } catch (e: any) {
      (window as any).__toast?.push?.({
        type: "error",
        message: "Create failed",
        description: e?.response?.data?.message || e?.message || "Please review the form.",
      });
    }
  };

  return (
    <>
      <Head><title>New Booking</title></Head>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Booking</h1>
            <p className="text-sm text-muted-foreground">Create a booking with dates, rooms and guests.</p>
          </div>
          <Link href="/bookings" className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Back</Link>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border bg-white/60 backdrop-blur p-5 shadow-sm space-y-6">
          {/* Row 1: customer + source + hotel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Customer ID</label>
              <input
                type="number"
                placeholder="e.g. 123"
                {...register("customerId")}
                className={cx("mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20", errors.customerId && "border-rose-300")}
              />
              {errors.customerId && <p className="mt-1 text-xs text-rose-600">{errors.customerId.message as string}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Source</label>
              <select
                {...register("sourceId")}
                disabled={loadingMeta}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20 disabled:opacity-50"
              >
                <option value="">Select source</option>
                {meta.sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Hotel (optional, for availability)</label>
              <input type="number" placeholder="Hotel ID" {...register("hotelId")} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20" />
            </div>
          </div>

          {/* Row 2: dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Check-in</label>
              <input type="datetime-local" {...register("checkIn")} className={cx("mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20", errors.checkIn && "border-rose-300")} />
              {errors.checkIn && <p className="mt-1 text-xs text-rose-600">{errors.checkIn.message as string}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Check-out</label>
              <input type="datetime-local" {...register("checkOut")} className={cx("mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20", errors.checkOut && "border-rose-300")} />
              {errors.checkOut && <p className="mt-1 text-xs text-rose-600">{errors.checkOut.message as string}</p>}
            </div>
          </div>

          {/* Row 3: availability + room select */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600">Available Rooms</label>
              <div className="mt-1 flex gap-2">
                <select multiple size={5} {...register("rooms")} className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20">
                  {roomsAvail.map((r) => <option key={r.id} value={r.id}>#{r.id} — {r.number}</option>)}
                </select>
                <button type="button" onClick={fetchAvailability} disabled={!canQueryAvail || loadingAvail} className="shrink-0 h-10 rounded-xl border px-3 text-sm hover:bg-gray-50 disabled:opacity-50" title="Refresh availability">
                  {loadingAvail ? "…" : "Refresh"}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple rooms.</p>
            </div>

            <div>
              <div className="flex items-center justify-between"><label className="text-xs font-medium text-gray-600">Quick actions</label></div>
              <div className="mt-1 grid grid-cols-1 gap-2">
                <button type="button" className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setValue("rooms", [])}>Clear selection</button>
                <Link href="/rooms" className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 text-center">Manage rooms</Link>
              </div>
            </div>
          </div>

          {/* Row 4: guests */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">Guests</label>
              <button type="button" onClick={() => addGuest({ name: "" })} className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">+ Add guest</button>
            </div>
            <div className="mt-2 space-y-2">
              {guestFields.length === 0 && <p className="text-sm text-gray-500">No guests added. Add at least primary guest.</p>}
              {guestFields.map((f: { id: string }, idx: number) => (
                <div key={f.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-[11px] font-medium text-gray-600">Name</label>
                    <input
                      type="text"
                      {...register(`guests.${idx}.name` as const)}
                      className={cx("mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20", errors.guests?.[idx]?.name && "border-rose-300")}
                      placeholder="Full name"
                    />
                    {errors.guests?.[idx]?.name && <p className="mt-1 text-xs text-rose-600">{(errors.guests?.[idx]?.name as any)?.message}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-600">ID Type ID (optional)</label>
                    <input type="number" {...register(`guests.${idx}.idTypeId` as const)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20" placeholder="e.g. 1" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[11px] font-medium text-gray-600">ID Number (optional)</label>
                      <input type="text" {...register(`guests.${idx}.idNumber` as const)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-black/20" placeholder="e.g. A1234" />
                    </div>
                    <button type="button" onClick={() => removeGuest(idx)} className="self-end h-10 rounded-xl border px-3 text-sm hover:bg-gray-50">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Link href="/bookings" className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Cancel</Link>
            <button type="submit" disabled={isSubmitting} className="rounded-xl bg-black text-white px-5 py-2 text-sm font-medium hover:bg-black/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
              {isSubmitting ? "Saving…" : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
