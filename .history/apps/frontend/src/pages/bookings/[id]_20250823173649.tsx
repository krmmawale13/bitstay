// apps/frontend/src/pages/bookings/[id].tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import bookingsService, { BookingStatus } from "@/services/bookings.service";
import { inr, fmtDateTime, statusLabel, statusChipClass, cls } from "@/lib/booking.util";
import {
  ArrowLeft,
  CalendarCheck2,
  DoorClosed,
  DoorOpen,
  XCircle,
  Clock3,
  BedSingle,
  IndianRupee,
  UserPlus2,
  Plus,
  CalendarPlus2,
} from "lucide-react";

// components
import GuestEditor from "@/components/bookings/GuestsEditor";
import ChargeModal from "@/components/bookings/ChargeModal";
import PaymentModal from "@/components/bookings/PaymentModal";
import AllocateRoomModal from "@/components/bookings/AllocateRoomModal";
import HistoryTimeline from "@/components/bookings/HistoryTimeline";

/* ------------------------- toast helper ------------------------- */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

/* ------------------------- local slab shape (to satisfy ChargeModal) ------------------------- */
type SlabLike = { id: number; code?: string; name?: string; taxPercent: number };

/* ------------------------- page ------------------------- */
export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const bookingId = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [id]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<any>(null);
  const [paymentModes, setPaymentModes] = useState<Array<{ id: number; mode: string }>>([]);
  const [idTypes, setIdTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [slabs, setSlabs] = useState<SlabLike[]>([]); // normalized HSN/GST slabs if provided by backend

  // modal states
  const [showGuests, setShowGuests] = useState(false);
  const [showCharge, setShowCharge] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [showExtend, setShowExtend] = useState(false);

  // load meta + booking
  useEffect(() => {
    if (!bookingId) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const [meta, b] = await Promise.all([bookingsService.getMeta(), bookingsService.get(bookingId)]);
        if (!mounted) return;

        setPaymentModes(meta.paymentModes || []);
        setIdTypes(meta.idTypes || []);

        // Normalize optional GST/HSN slabs if your backend exposes them in meta
        const rawGst = (meta as any)?.gstSlabs || (meta as any)?.hsnSlabs || [];
        const normalized: SlabLike[] = Array.isArray(rawGst)
          ? rawGst.map((s: any) => ({
              id: Number(s.id),
              code: s.code ?? s.hsnCode ?? s.hsn ?? undefined,
              name: s.name ?? s.description ?? undefined,
              taxPercent: Number(s.taxPercent ?? s.rate ?? s.gst ?? 0),
            }))
          : [];
        setSlabs(normalized);

        setData(b);
      } catch (e: any) {
        toast("error", "Failed to load booking", e?.message);
        router.replace("/bookings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [bookingId, router]);

  async function refresh() {
    if (!bookingId) return;
    const b = await bookingsService.get(bookingId);
    setData(b);
  }

  // derived totals for gating checkout & showing balances
  const charges = data?.bookingcharge || [];
  const payments = data?.payments || [];
  const chargesTotal = useMemo(
    () =>
      charges.reduce(
        (s: number, c: any) => s + Number(c.amount || 0) + Number(c.taxAmount || 0),
        0
      ),
    [charges]
  );
  const paymentsTotal = useMemo(
    () => payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
    [payments]
  );
  const balance = Math.max(0, chargesTotal - paymentsTotal);

  // actions
  async function onCheckIn() {
    if (!bookingId) return;
    try {
      setBusy(true);
      await bookingsService.checkIn(bookingId);
      toast("success", "Guest checked-in");
      await refresh();
    } catch (e: any) {
      toast("error", "Check-in failed", e?.message);
    } finally {
      setBusy(false);
    }
  }
  async function onCheckOut() {
    if (!bookingId) return;
    if (balance > 0) {
      toast("error", "Settle the outstanding balance before checkout.");
      return;
    }
    try {
      setBusy(true);
      await bookingsService.checkOut(bookingId);
      toast("success", "Checked-out");
      await refresh();
    } catch (e: any) {
      toast("error", "Check-out failed", e?.message);
    } finally {
      setBusy(false);
    }
  }
  async function onCancel() {
    if (!bookingId) return;
    try {
      setBusy(true);
      await bookingsService.cancel(bookingId);
      toast("success", "Booking cancelled");
      await refresh();
    } catch (e: any) {
      toast("error", "Cancel failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  // extend stay
  async function onExtendSave(newCheckOutISO: string) {
    if (!bookingId) return;
    try {
      setBusy(true);
      await bookingsService.update(bookingId, { checkOut: newCheckOutISO });
      toast("success", "Stay extended");
      setShowExtend(false);
      await refresh();
    } catch (e: any) {
      toast("error", "Extend failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  if (!router.isReady || loading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <div className="h-9 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-52 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="p-6">
          <button
            onClick={() => router.push("/bookings")}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="mt-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-200">
            Booking not found or access denied.
          </div>
        </div>
      </MainLayout>
    );
  }

  const status: BookingStatus = data.status;
  const canCheckIn = status === "CONFIRMED";
  const canCheckOut = status === "CHECKED_IN";
  const canCancel = status === "PENDING" || status === "CONFIRMED";

  const rooms = (data.rooms || []).map((r: any) => r.room);

  // nights for room estimate
  const nights = useMemo(() => {
    const A = new Date(data.checkIn).getTime();
    const B = new Date(data.checkOut).getTime();
    if (!Number.isFinite(A) || !Number.isFinite(B)) return 0;
    const diff = Math.max(0, B - A);
    return Math.max(1, Math.ceil(diff / 86400000));
  }, [data.checkIn, data.checkOut]);

  const checkoutDisabled = balance > 0 || !canCheckOut;

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/bookings")}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div>
              <div className="text-2xl font-bold">Booking #{data.id}</div>
              <div className="text-sm text-slate-500">
                {data.customer?.name ?? "—"} • {fmtDateTime(data.checkIn)} → {fmtDateTime(data.checkOut)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cls("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ring-1", statusChipClass(status))}>
              <Clock3 size={16} />
              {statusLabel(status)}
            </span>

            <button
              onClick={() => setShowExtend(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
              title="Extend stay"
            >
              <CalendarPlus2 size={16} />
              Extend
            </button>

            {canCheckIn && (
              <button
                onClick={onCheckIn}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
              >
                <DoorOpen size={16} />
                Check-in
              </button>
            )}

            {canCheckOut && (
              <button
                onClick={onCheckOut}
                disabled={busy || checkoutDisabled}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
                title={checkoutDisabled ? "Settle due to enable check-out" : "Check-out"}
              >
                <DoorClosed size={16} />
                Check-out
              </button>
            )}

            {canCancel && (
              <button
                onClick={onCancel}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-60"
              >
                <XCircle size={16} />
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Rooms */}
          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Rooms</div>
              <button
                onClick={() => setShowAllocate(true)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-500"
              >
                <BedSingle size={14} />
                Allocate Room
              </button>
            </div>
            {rooms.length ? (
              <>
                <ul className="space-y-2">
                  {rooms.map((r: any) => (
                    <li key={r.id} className="flex items-center gap-2 text-sm">
                      <BedSingle size={16} className="text-slate-400" />
                      <span className="font-medium">#{r.number}</span>
                      <span className="text-slate-500">• {r.type?.name ?? "—"}</span>
                      <span className="text-slate-500">• {r.hotel?.name ?? "—"}</span>
                      <span className="ml-auto text-slate-700">{typeof r.rate === "number" ? `${inr(r.rate)} / night` : "—"}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Estimated room total ({nights} night{nights > 1 ? "s" : ""})</span>
                  <span className="font-medium">
                    {inr(rooms.reduce((s: number, rr: any) => s + Number(rr?.rate ?? 0), 0) * nights)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500">No room allocated yet.</div>
            )}
          </div>

          {/* Charges */}
          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowCharge(true)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-500"
              >
                <Plus size={14} />
                Add Charge
              </button>
              <div className="text-sm text-slate-600">
                Total: <span className="font-semibold">{inr(chargesTotal)}</span>
              </div>
            </div>
            {charges.length ? (
              <ul className="space-y-2">
                {charges.map((c: any) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-800">{c.description}</span>
                    <span className="ml-auto">{inr(Number(c.amount || 0))}</span>
                    {Number(c.taxAmount || 0) > 0 && <span className="text-slate-500">+ {inr(Number(c.taxAmount))} tax</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">No charges yet.</div>
            )}

            {/* Balance hint */}
            <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm flex items-center justify-between">
              <span>Balance due</span>
              <span className={cls("font-semibold", balance > 0 ? "text-rose-600" : "text-emerald-600")}>{inr(balance)}</span>
            </div>
          </div>

          {/* Payments */}
          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowPayment(true)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <IndianRupee size={14} />
                Add Payment
              </button>
              <div className="text-sm text-slate-600">
                Total: <span className="font-semibold">{inr(paymentsTotal)}</span>
              </div>
            </div>
            {payments.length ? (
              <ul className="space-y-2">
                {payments.map((p: any) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-800">{fmtDateTime(p.createdAt)}</span>
                    <span className="ml-auto">{inr(Number(p.amount || 0))}</span>
                    <span className="text-slate-500">• {p.mode?.mode ?? "—"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">No payments yet.</div>
            )}
          </div>
        </div>

        {/* Guests + Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="font-semibold">
                Guests {Array.isArray(data.guests) && data.guests.length ? `(${data.guests.length})` : ""}
              </div>
              <button
                onClick={() => setShowGuests(true)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                <UserPlus2 size={14} />
                Add
              </button>
            </div>
            {data.guests?.length ? (
              <ul className="mt-3 space-y-2">
                {data.guests.map((g: any) => (
                  <li key={g.id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{g.name}</span>
                    <span className="text-slate-500">
                      {g.idType?.name ? `ID: ${g.idType.name}` : g.idTypeId ? `ID #${g.idTypeId}` : "—"}
                      {g.idNumber ? ` • No: ${g.idNumber}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 text-sm text-slate-500">
                No guests added. Primary guest will be treated as{" "}
                <span className="font-medium">{data.customer?.name ?? "Customer"}</span>.
              </div>
            )}
          </div>

          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="font-semibold mb-2">Activity</div>
            <div className="max-h-[360px] lg:max-h-[420px] overflow-y-auto pr-1">
              <HistoryTimeline booking={data} />
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showGuests && (
        <GuestEditor bookingId={bookingId!} idTypes={idTypes} onAdded={refresh} onClose={() => setShowGuests(false)} />
      )}

      {showCharge && (
        <ChargeModal
          bookingId={bookingId!}
          // pass normalized slabs; cast to any to satisfy ChargeModal's internal Slab type
          gstSlabs={slabs as any}
          onAdded={refresh}
          onClose={() => setShowCharge(false)}
        />
      )}

      {showPayment && (
        <PaymentModal bookingId={bookingId!} paymentModes={paymentModes} onAdded={refresh} onClose={() => setShowPayment(false)} />
      )}

      {showAllocate && (
        <AllocateRoomModal
          bookingId={bookingId!}
          checkInISO={data.checkIn}
          checkOutISO={data.checkOut}
          hotelId={data.rooms?.[0]?.room?.hotelId}
          onSuccess={refresh}
          onClose={() => setShowAllocate(false)}
        />
      )}

      {showExtend && (
        <ExtendStayModal current={data.checkOut} onSave={onExtendSave} onClose={() => setShowExtend(false)} />
      )}
    </MainLayout>
  );
}

/* ------------------------- ExtendStayModal ------------------------- */
function ExtendStayModal({
  current,
  onSave,
  onClose,
}: {
  current: string;
  onSave: (newCheckOutISO: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState<string>(() => {
    const d = new Date(current);
    if (Number.isNaN(d.getTime())) return "";
    d.setHours(d.getHours() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  function add(hours = 0, days = 0) {
    if (!value) return;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return;
    d.setHours(d.getHours() + hours);
    d.setDate(d.getDate() + days);
    const pad = (n: number) => String(n).padStart(2, "0");
    setValue(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-[101] w-full max-w-xl rounded-2xl border border-white/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/20 dark:border-slate-800">
          <div className="text-sm font-semibold">Extend stay</div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-xs text-slate-500">
            Update only the <strong>check-out</strong>. Availability will be re-validated.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">New check-out</label>
              <input
                type="datetime-local"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 pt-5 sm:pt-7">
              <button
                onClick={() => add(1, 0)}
                className="rounded-md px-2.5 py-1.5 text-xs ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:ring-slate-700 dark:bg-slate-800"
              >
                +1h
              </button>
              <button
                onClick={() => add(0, 1)}
                className="rounded-md px-2.5 py-1.5 text-xs ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:ring-slate-700 dark:bg-slate-800"
              >
                +1d
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/20 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(value)}
            className="rounded-lg px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
