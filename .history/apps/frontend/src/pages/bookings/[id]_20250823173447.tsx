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

import GuestsEditor from "@/components/bookings/GuestsEditor";
import ChargeModal from "@/components/bookings/ChargeModal";
import PaymentModal from "@/components/bookings/PaymentModal";
import AllocateRoomModal from "@/components/bookings/AllocateRoomModal";
import HistoryTimeline from "@/components/bookings/HistoryTimeline";

/* toast */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

type PaymentMode = { id: number; mode: string };
type GstSlab = { id: number; name: string; hsn?: string | null; ratePercent: number };

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

  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [gstSlabs, setGstSlabs] = useState<GstSlab[]>([]);
  const [idTypes, setIdTypes] = useState<{ id: number; name: string }[]>([]);

  // modals
  const [showGuests, setShowGuests] = useState(false);
  const [showCharge, setShowCharge] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [showExtend, setShowExtend] = useState(false);

  // extend state
  const [newCheckout, setNewCheckout] = useState<string>("");

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
        // optional: gst slabs (if backend provides)
        setGstSlabs((meta as any)?.gstSlabs || []);
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

  // actions
  async function onConfirm() {
    if (!bookingId) return;
    try {
      setBusy(true);
      await bookingsService.confirmBooking(bookingId);
      toast("success", "Booking confirmed");
      await refresh();
    } catch (e: any) {
      toast("error", "Confirm failed", e?.message);
    } finally {
      setBusy(false);
    }
  }
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
  const canConfirm = status === "PENDING";
  const canCheckIn = status === "CONFIRMED";
  const canCheckOut = status === "CHECKED_IN";
  const canCancel = status === "PENDING" || status === "CONFIRMED";

  const rooms = (data.rooms || []).map((r: any) => r.room);
  const charges = data.bookingcharge || [];
  const payments = data.payments || [];

  const chargesTotal = charges.reduce(
    (s: number, c: any) => s + Number(c.amount || 0) + Number(c.taxAmount || 0),
    0
  );
  const paymentsTotal = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const balance = Math.round((chargesTotal - paymentsTotal) * 100) / 100;

  const balanceBadge = (() => {
    if (balance > 0) return { text: `Due ${inr(balance)}`, cls: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-800" };
    if (balance < 0) return { text: `Overpaid ${inr(Math.abs(balance))}`, cls: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:ring-indigo-800" };
    return { text: "Settled", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800" };
  })();

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

            <span className={cls("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ring-1", balanceBadge.cls)}>
              <IndianRupee size={14} />
              {balanceBadge.text}
            </span>

            {canConfirm && (
              <button
                onClick={onConfirm}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-60"
              >
                <CalendarCheck2 size={16} />
                Confirm
              </button>
            )}
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
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExtend(true)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                  title="Extend stay"
                >
                  <CalendarPlus2 size={14} />
                  Extend Stay
                </button>
                <button
                  onClick={() => setShowAllocate(true)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  <BedSingle size={14} />
                  Allocate Room
                </button>
              </div>
            </div>
            {rooms.length ? (
              <ul className="space-y-2">
                {rooms.map((r: any) => (
                  <li key={r.id} className="flex items-center gap-2 text-sm">
                    <BedSingle size={16} className="text-slate-400" />
                    <span className="font-medium">#{r.number}</span>
                    <span className="text-slate-500">• {r.type?.name ?? "—"}</span>
                    <span className="text-slate-500">• {r.hotel?.name ?? "—"}</span>
                    <span className="ml-auto text-slate-700">{inr(r.rate)}</span>
                  </li>
                ))}
              </ul>
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
                Charges: <span className="font-semibold">{inr(chargesTotal)}</span>
              </div>
            </div>
            {charges.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="py-1 pr-3">Description</th>
                      <th className="py-1 pr-3">Base</th>
                      <th className="py-1 pr-3">GST</th>
                      <th className="py-1 pr-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {charges.map((c: any) => {
                      const base = Number(c.amount || 0);
                      const tax = Number(c.taxAmount || 0);
                      const tot = base + tax;
                      return (
                        <tr key={c.id}>
                          <td className="py-1 pr-3">{c.description}</td>
                          <td className="py-1 pr-3">{inr(base)}</td>
                          <td className="py-1 pr-3">{inr(tax)}</td>
                          <td className="py-1 pr-3 font-medium">{inr(tot)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-500">No charges yet.</div>
            )}
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
                Paid: <span className="font-semibold">{inr(paymentsTotal)}</span>
              </div>
            </div>
            {payments.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="py-1 pr-3">Date</th>
                      <th className="py-1 pr-3">Amount</th>
                      <th className="py-1 pr-3">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {payments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-1 pr-3">{fmtDateTime(p.createdAt)}</td>
                        <td className="py-1 pr-3">{inr(Number(p.amount || 0))}</td>
                        <td className="py-1 pr-3">{p.mode?.mode ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-500">No payments yet.</div>
            )}
          </div>
        </div>

        {/* Guests + History */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Guests</div>
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
              <div className="mt-3 text-sm text-slate-500">No guests added.</div>
            )}
          </div>

          <HistoryTimeline booking={data} />
        </div>
      </div>

      {/* MODALS */}
      {showGuests && (
        <GuestsEditor
          bookingId={bookingId!}
          idTypes={idTypes}
          onAdded={refresh}
          onClose={() => setShowGuests(false)}
        />
      )}

      {showCharge && (
        <ChargeModal
          bookingId={bookingId!}
          gstSlabs={gstSlabs}
          onAdded={refresh}
          onClose={() => setShowCharge(false)}
        />
      )}

      {showPayment && (
        <PaymentModal
          bookingId={bookingId!}
          paymentModes={paymentModes}
          onAdded={refresh}
          onClose={() => setShowPayment(false)}
        />
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
        <ExtendStayModal
          current={data.checkOut}
          onClose={() => setShowExtend(false)}
          onSave={async (iso) => {
            try {
              setBusy(true);
              await bookingsService.update(bookingId!, { checkOut: iso });
              toast("success", "Stay extended");
              setShowExtend(false);
              await refresh();
            } catch (e: any) {
              toast("error", "Extend failed", e?.message);
            } finally {
              setBusy(false);
            }
          }}
          value={newCheckout}
          onChange={setNewCheckout}
        />
      )}
    </MainLayout>
  );
}

/* ---------- ExtendStay inline modal ---------- */
function ExtendStayModal({
  current,
  value,
  onChange,
  onSave,
  onClose,
}: {
  current: string;
  value: string;
  onChange: (v: string) => void;
  onSave: (iso: string) => Promise<void>;
  onClose: () => void;
}) {
  const min = useMemo(() => {
    // current checkout as min
    try {
      const d = new Date(current);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  }, [current]);

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-[111] w-full max-w-md rounded-2xl border border-white/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl">
        <div className="px-5 py-3 border-b border-white/20 dark:border-slate-800 text-sm font-semibold">Extend Stay</div>
        <div className="p-5 space-y-3">
          <div className="text-xs text-slate-500">Current checkout: {fmtDateTime(current)}</div>
          <div>
            <label className="text-sm font-medium">New checkout</label>
            <input
              type="datetime-local"
              min={min}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900"
            />
            <p className="mt-1 text-xs text-slate-500">Must be after current checkout. Availability will be re-checked.</p>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/20 dark:border-slate-800 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={() => onSave(value)}
            className="rounded-lg px-3 py-1.5 text-sm text-white bg-slate-900 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            disabled={!value}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
