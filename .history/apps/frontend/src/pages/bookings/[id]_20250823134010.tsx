// apps/frontend/src/pages/bookings/[id].tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import bookingsService, {
  AddChargeInput,
  AddPaymentInput,
  BookingStatus,
} from "@/services/bookings.service";
import { inr, fmtDateTime, statusLabel, statusChipClass, cls } from "@/lib/booking.util";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Clock3,
  CalendarCheck2,
  DoorOpen,
  DoorClosed,
  XCircle,
  IndianRupee,
  UserPlus2,
  BedSingle,
} from "lucide-react";

/* ------------------------- toast helper ------------------------- */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

/* ------------------------- types ------------------------- */
type IdType = { id: number; name: string };
type PaymentMode = { id: number; mode: string };

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
  const [idTypes, setIdTypes] = useState<IdType[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);

  // local modals state
  const [showGuest, setShowGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestIdTypeId, setGuestIdTypeId] = useState<number | undefined>(undefined);
  const [guestIdNumber, setGuestIdNumber] = useState("");

  const [showCharge, setShowCharge] = useState(false);
  const [chargeDesc, setChargeDesc] = useState("");
  const [chargeAmt, setChargeAmt] = useState("");
  const [chargeTax, setChargeTax] = useState("");

  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmt, setPaymentAmt] = useState("");
  const [paymentModeId, setPaymentModeId] = useState<number | undefined>(undefined);

  // load meta + booking
  useEffect(() => {
    if (!bookingId) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const [meta, b] = await Promise.all([bookingsService.getMeta(), bookingsService.get(bookingId)]);
        if (!mounted) return;
        setIdTypes(meta.idTypes || []);
        setPaymentModes(meta.paymentModes || []);
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

  async function onAddGuest() {
    if (!bookingId) return;
    if (!guestName.trim()) {
      toast("error", "Guest name is required");
      return;
    }
    try {
      setBusy(true);
      await bookingsService.addGuests(bookingId, {
        guests: [{ name: guestName.trim(), idTypeId: guestIdTypeId, idNumber: guestIdNumber || undefined }],
      });
      toast("success", "Guest added");
      setShowGuest(false);
      setGuestName("");
      setGuestIdTypeId(undefined);
      setGuestIdNumber("");
      await refresh();
    } catch (e: any) {
      toast("error", "Add guest failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  async function onRemoveGuest(guestId: number) {
    if (!bookingId) return;
    if (!confirm("Remove this guest from booking?")) return;
    try {
      setBusy(true);
      await bookingsService.removeGuest(bookingId, guestId);
      toast("success", "Guest removed");
      await refresh();
    } catch (e: any) {
      toast("error", "Remove guest failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  async function onAddCharge() {
    if (!bookingId) return;
    try {
      const payload: AddChargeInput = {
        description: chargeDesc.trim(),
        amount: chargeAmt,
        taxAmount: chargeTax || undefined,
      };
      setBusy(true);
      await bookingsService.addCharge(bookingId, payload);
      toast("success", "Charge added");
      setShowCharge(false);
      setChargeDesc("");
      setChargeAmt("");
      setChargeTax("");
      await refresh();
    } catch (e: any) {
      toast("error", "Add charge failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  async function onAddPayment() {
    if (!bookingId) return;
    try {
      const payload: AddPaymentInput = {
        amount: paymentAmt,
        modeId: paymentModeId,
      };
      setBusy(true);
      await bookingsService.addPayment(bookingId, payload);
      toast("success", "Payment recorded");
      setShowPayment(false);
      setPaymentAmt("");
      setPaymentModeId(undefined);
      await refresh();
    } catch (e: any) {
      toast("error", "Add payment failed", e?.message);
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

        {/* Summary card */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="font-semibold mb-2">Rooms</div>
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

          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="font-semibold mb-2">Charges</div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowCharge(true)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-500"
              >
                <Plus size={14} />
                Add Charge
              </button>
              <div className="text-sm text-slate-600">
                Total:{" "}
                <span className="font-semibold">
                  {inr(charges.reduce((s: number, c: any) => s + Number(c.amount || 0) + Number(c.taxAmount || 0), 0))}
                </span>
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
          </div>

          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="font-semibold mb-2">Payments</div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowPayment(true)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <IndianRupee size={14} />
                Add Payment
              </button>
              <div className="text-sm text-slate-600">
                Total:{" "}
                <span className="font-semibold">
                  {inr(payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0))}
                </span>
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

        {/* Guests + History */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Guests</div>
              <button
                onClick={() => setShowGuest(true)}
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
                    <button
                      className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-xs bg-rose-600 text-white hover:bg-rose-500"
                      onClick={() => onRemoveGuest(g.id)}
                      disabled={busy}
                      title="Remove guest"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 text-sm text-slate-500">No guests added.</div>
            )}
          </div>

          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="font-semibold mb-2">Room Allocation History</div>
            {data.roomAllocationHistory?.length ? (
              <ul className="space-y-2 text-sm">
                {data.roomAllocationHistory
                  .slice()
                  .reverse()
                  .map((h: any) => (
                    <li key={h.id} className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="text-slate-700">
                        {fmtDateTime(h.changedAt)}: #{h.oldRoomId ?? "—"} → #{h.newRoomId ?? "—"}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">No changes recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showGuest && (
        <Modal title="Add Guest" onClose={() => setShowGuest(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Guest name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">ID Type</label>
              <select
                value={guestIdTypeId ?? ""}
                onChange={(e) => setGuestIdTypeId(e.target.value ? Number(e.target.value) : undefined)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Select</option>
                {idTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">ID Number</label>
              <input
                value={guestIdNumber}
                onChange={(e) => setGuestIdNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Document number"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowGuest(false)}
                className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={onAddGuest}
                disabled={busy}
                className="rounded-lg px-3 py-1.5 text-sm text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showCharge && (
        <Modal title="Add Charge" onClose={() => setShowCharge(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Description</label>
              <input
                value={chargeDesc}
                onChange={(e) => setChargeDesc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900"
                placeholder="e.g., Room service"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Amount</label>
                <input
                  value={chargeAmt}
                  onChange={(e) => setChargeAmt(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900"
                  placeholder="₹0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tax Amount</label>
                <input
                  value={chargeTax}
                  onChange={(e) => setChargeTax(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900"
                  placeholder="₹0.00"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCharge(false)}
                className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={onAddCharge}
                disabled={busy}
                className="rounded-lg px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showPayment && (
        <Modal title="Add Payment" onClose={() => setShowPayment(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Amount</label>
                <input
                  value={paymentAmt}
                  onChange={(e) => setPaymentAmt(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900"
                  placeholder="₹0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mode</label>
                <select
                  value={paymentModeId ?? ""}
                  onChange={(e) => setPaymentModeId(e.target.value ? Number(e.target.value) : undefined)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">Select</option>
                  {paymentModes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.mode}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPayment(false)}
                className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={onAddPayment}
                disabled={busy}
                className="rounded-lg px-3 py-1.5 text-sm text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

/* ------------------------- Modal ------------------------- */
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={containerRef}
        className="relative z-[101] w-full max-w-lg rounded-2xl border border-white/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/20 dark:border-slate-800">
          <div className="text-sm font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <div className="max-h-[80vh] overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}
