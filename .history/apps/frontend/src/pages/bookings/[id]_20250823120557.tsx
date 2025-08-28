import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import bookingsService, {
  AddPaymentInput,
  AddChargeInput,
  BookingGuestInput,
} from "@/services/bookings.service";
import {
  ArrowLeft,
  CalendarDays,
  Hotel,
  BedDouble,
  Users,
  Plus,
  CircleDollarSign,
  CreditCard,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
} from "lucide-react";

/* ------------------------- non-breaking toast helper ------------------------- */
function notify(
  type: "success" | "error" | "info",
  message: string,
  opts?: { description?: string }
) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  if (api && typeof api.push === "function") {
    api.push({ type, message, description: opts?.description });
  } else {
    console.log(`[toast:${type}] ${message}`, opts?.description ?? "");
  }
}

/* ---------------------------------- utils ---------------------------------- */
function fmt(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}
function money(n?: number | string | null) {
  if (n === null || n === undefined) return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return String(n);
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(v);
}
function cls(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}
function StatusBadge({ s }: { s?: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800",
    CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-800",
    CHECKED_IN: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800",
    CHECKED_OUT: "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
    CANCELLED: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-800",
  };
  const cn = map[s || "PENDING"] ?? map.PENDING;
  return <span className={cls("inline-flex items-center rounded-full px-2.5 py-1 text-xs ring-1", cn)}>{s || "—"}</span>;
}

/* ---------------------------------- page ---------------------------------- */
export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const bookingId = useMemo(() => {
    if (!router.isReady) return undefined;
    const raw = Array.isArray(id) ? id[0] : id;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [id, router.isReady]);

  const [loading, setLoading] = useState<boolean>(false);
  const [meta, setMeta] = useState<{ paymentModes: any[]; idTypes: any[]; sources: any[] }>({ paymentModes: [], idTypes: [], sources: [] });
  const [b, setB] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // dialogs
  const [showAlloc, setShowAlloc] = useState(false);
  const [allocRoomId, setAllocRoomId] = useState<number | "">("");
  const [showGuest, setShowGuest] = useState(false);
  const [newGuest, setNewGuest] = useState<BookingGuestInput>({ name: "", idTypeId: undefined, idNumber: "" });
  const [showCharge, setShowCharge] = useState(false);
  const [charge, setCharge] = useState<AddChargeInput>({ description: "", amount: "", taxAmount: "" });
  const [showPayment, setShowPayment] = useState(false);
  const [pay, setPay] = useState<AddPaymentInput>({ amount: "", modeId: undefined });

  // form refs for Enter submit UX
//   const allocRef = useRef<HTMLSelectElement | null>(null);
const allocRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (!bookingId) {
      notify("error", "Invalid booking id");
      router.replace("/bookings");
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [detail, m] = await Promise.all([
          bookingsService.get(bookingId),
          bookingsService.getMeta(),
        ]);
        setB(detail);
        setMeta({
          paymentModes: m?.paymentModes ?? [],
          idTypes: m?.idTypes ?? [],
          sources: m?.sources ?? [],
        });
      } catch (e: any) {
        setError(e?.message || "Failed to load booking");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId, router]);

  async function refresh() {
    if (!bookingId) return;
    try {
      const fresh = await bookingsService.get(bookingId);
      setB(fresh);
    } catch (e: any) {
      notify("error", "Refresh failed", { description: e?.message });
    }
  }

  // actions
  async function doAllocateRoom() {
    if (!bookingId || !allocRoomId || typeof allocRoomId !== "number") {
      notify("error", "Select a room first");
      return;
    }
    try {
      await bookingsService.allocateRoom(bookingId, { newRoomId: allocRoomId });
      notify("success", "Room allocated");
      setShowAlloc(false);
      setAllocRoomId("");
      refresh();
    } catch (e: any) {
      notify("error", "Allocation failed", { description: e?.message });
    }
  }

  async function doAddGuest() {
    if (!bookingId) return;
    if (!newGuest.name?.trim()) {
      notify("error", "Guest name is required");
      return;
    }
    try {
      await bookingsService.addGuests(bookingId, { guests: [newGuest] });
      notify("success", "Guest added");
      setShowGuest(false);
      setNewGuest({ name: "", idTypeId: undefined, idNumber: "" });
      refresh();
    } catch (e: any) {
      notify("error", "Add guest failed", { description: e?.message });
    }
  }

  async function doAddCharge() {
    if (!bookingId) return;
    if (!charge.description?.trim() || !charge.amount) {
      notify("error", "Description and amount are required");
      return;
    }
    try {
      await bookingsService.addCharge(bookingId, charge);
      notify("success", "Charge added");
      setShowCharge(false);
      setCharge({ description: "", amount: "", taxAmount: "" });
      refresh();
    } catch (e: any) {
      notify("error", "Add charge failed", { description: e?.message });
    }
  }

  async function doAddPayment() {
    if (!bookingId) return;
    if (!pay.amount) {
      notify("error", "Amount is required");
      return;
    }
    try {
      await bookingsService.addPayment(bookingId, pay);
      notify("success", "Payment recorded");
      setShowPayment(false);
      setPay({ amount: "", modeId: undefined });
      refresh();
    } catch (e: any) {
      notify("error", "Add payment failed", { description: e?.message });
    }
  }

  async function doStatus(action: "check-in" | "check-out" | "cancel") {
    if (!bookingId) return;
    try {
      if (action === "check-in") await bookingsService.checkIn(bookingId);
      if (action === "check-out") await bookingsService.checkOut(bookingId);
      if (action === "cancel") await bookingsService.cancel(bookingId);
      notify("success", `Status updated (${action})`);
      refresh();
    } catch (e: any) {
      notify("error", "Status update failed", { description: e?.message });
    }
  }

  // UI
  if (!router.isReady || loading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-40 xl:col-span-3 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !b) {
    return (
      <MainLayout>
        <div className="p-6">
          <button
            onClick={() => router.push("/bookings")}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm
                       bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 p-6 text-rose-800 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200">
            {error || "Booking not found"}
          </div>
        </div>
      </MainLayout>
    );
  }

  const totalCharges =
    (b.bookingcharge || []).reduce((sum: number, c: any) => sum + Number(c.amount || 0) + Number(c.taxAmount || 0), 0) || 0;
  const totalPayments =
    (b.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0) || 0;
  const balance = totalCharges - totalPayments;

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/bookings")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm
                         bg-slate-200 hover:bg-slate-300
                         dark:bg-slate-700 dark:hover:bg-slate-600 transition"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <CalendarDays size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Booking #{b.id} <StatusBadge s={b.status} />
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {b.customer?.name || "—"} • {fmt(b.checkIn)} → {fmt(b.checkOut)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAlloc(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200
                         bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
            >
              <BedDouble size={16} />
              Allocate Room
            </button>
            <button
              onClick={() => setShowGuest(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200
                         bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
            >
              <Users size={16} />
              Add Guest
            </button>
            <button
              onClick={() => setShowCharge(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200
                         bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
            >
              <CircleDollarSign size={16} />
              Add Charge
            </button>
            <button
              onClick={() => setShowPayment(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200
                         bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
            >
              <CreditCard size={16} />
              Add Payment
            </button>

            {/* status actions */}
            <button
              onClick={() => doStatus("check-in")}
              disabled={b.status !== "CONFIRMED"}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
              title="Check-in (allowed from CONFIRMED)"
            >
              <LogIn size={16} />
              Check-in
            </button>
            <button
              onClick={() => doStatus("check-out")}
              disabled={b.status !== "CHECKED_IN"}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
              title="Check-out (allowed from CHECKED_IN)"
            >
              <LogOut size={16} />
              Check-out
            </button>
            <button
              onClick={() => doStatus("cancel")}
              disabled={b.status === "CHECKED_OUT" || b.status === "CANCELLED"}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-60"
              title="Cancel (not allowed after CHECKED_OUT)"
            >
              <XCircle size={16} />
              Cancel
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Rooms */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <BedDouble size={18} className="text-slate-500" />
              <h2 className="font-semibold text-lg">Rooms</h2>
            </div>
            {(b.rooms?.length ?? 0) === 0 ? (
              <div className="text-sm text-slate-500">No room allocated.</div>
            ) : (
              <ul className="space-y-2">
                {b.rooms.map((br: any) => (
                  <li
                    key={br.id}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 text-sm"
                  >
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      #{br.room?.number ?? br.roomId}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {br.room?.type?.name ? `Type: ${br.room.type.name}` : ""}
                      {br.room?.hotel?.name ? ` • Hotel: ${br.room.hotel.name}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Guests */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-slate-500" />
                <h2 className="font-semibold text-lg">Guests</h2>
              </div>
              <button
                onClick={() => setShowGuest(true)}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs ring-1 ring-slate-200 dark:ring-slate-700"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            {(b.guests?.length ?? 0) === 0 ? (
              <div className="text-sm text-slate-500">No guests added.</div>
            ) : (
              <ul className="space-y-2">
                {b.guests.map((g: any, idx: number) => (
                  <li
                    key={idx}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 text-sm"
                  >
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {g.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {g.idType?.name ? `ID: ${g.idType.name}` : g.idTypeId ? `ID #${g.idTypeId}` : "ID: —"}
                      {g.idNumber ? ` • No: ${g.idNumber}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Financials */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={18} className="text-slate-500" />
              <h2 className="font-semibold text-lg">Billing</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500">Charges</div>
                <div className="font-semibold">{money(totalCharges)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500">Payments</div>
                <div className="font-semibold">{money(totalPayments)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500">Balance</div>
                <div className={cls("font-semibold", balance > 0 ? "text-rose-600" : "text-emerald-600")}>
                  {money(balance)}
                </div>
              </div>
            </div>

            {/* Recent charges & payments */}
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <CircleDollarSign size={16} />
                    Charges
                  </div>
                  <button
                    onClick={() => setShowCharge(true)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ring-1 ring-slate-200 dark:ring-slate-700"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>
                <ul className="mt-2 space-y-2 text-sm">
                  {(b.bookingcharge ?? []).map((c: any) => (
                    <li key={c.id} className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300">{c.description}</span>
                      <span className="text-slate-900 dark:text-slate-100">{money(Number(c.amount) + Number(c.taxAmount || 0))}</span>
                    </li>
                  ))}
                  {(b.bookingcharge ?? []).length === 0 && (
                    <li className="text-slate-500">No charges yet.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <div className="text-sm font-medium flex items-center gap-2">
                  <CreditCard size={16} />
                  Payments
                </div>
                <ul className="mt-2 space-y-2 text-sm">
                  {(b.payments ?? []).map((p: any) => (
                    <li key={p.id} className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300">
                        {fmt(p.createdAt)} {p.mode?.mode ? `• ${p.mode.mode}` : ""}
                      </span>
                      <span className="text-slate-900 dark:text-slate-100">{money(p.amount)}</span>
                    </li>
                  ))}
                  {(b.payments ?? []).length === 0 && (
                    <li className="text-slate-500">No payments yet.</li>
                  )}
                </ul>
                <button
                  onClick={() => setShowPayment(true)}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ring-1 ring-slate-200 dark:ring-slate-700"
                >
                  <Plus size={12} />
                  Add Payment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Audit / Alloc history (simple list) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Hotel size={18} className="text-slate-500" />
            <h2 className="font-semibold text-lg">Room Allocation History</h2>
          </div>
          {(b.roomAllocationHistory?.length ?? 0) === 0 ? (
            <div className="text-sm text-slate-500">No allocation changes.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {b.roomAllocationHistory.map((h: any) => (
                <li
                  key={h.id}
                  className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700"
                >
                  <div className="text-slate-800 dark:text-slate-100">
                    {fmt(h.changedAt)}: {h.oldRoomId ? `#${h.oldRoomId}` : "—"} →{" "}
                    {h.newRoomId ? `#${h.newRoomId}` : "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Allocate Room Modal */}
      {showAlloc && (
        <Modal title="Allocate Room" onClose={() => setShowAlloc(false)}>
          <div className="p-5">
            <label className="block text-sm mb-1">Select room ID</label>
            <input
              ref={allocRef}
              type="number"
              value={allocRoomId}
              onChange={(e) => setAllocRoomId(Number(e.target.value))}
              placeholder="e.g. 101"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowAlloc(false)}
                className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={doAllocateRoom}
                className="rounded-lg px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500"
              >
                <CheckCircle2 className="inline mr-1" size={14} />
                Allocate
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Guest Modal */}
      {showGuest && (
        <Modal title="Add Guest" onClose={() => setShowGuest(false)}>
          <div className="p-5 space-y-3">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                value={newGuest.name}
                onChange={(e) => setNewGuest((g) => ({ ...g, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                placeholder="Guest full name"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">ID Type</label>
              <select
                value={newGuest.idTypeId ?? ""}
                onChange={(e) =>
                  setNewGuest((g) => ({
                    ...g,
                    idTypeId: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {meta.idTypes.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">ID Number</label>
              <input
                value={newGuest.idNumber ?? ""}
                onChange={(e) => setNewGuest((g) => ({ ...g, idNumber: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                placeholder="e.g. ABC1234"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowGuest(false)}
                className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={doAddGuest}
                className="rounded-lg px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500"
              >
                <Plus className="inline mr-1" size={14} />
                Add
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Charge Modal */}
      {showCharge && (
        <Modal title="Add Charge" onClose={() => setShowCharge(false)}>
          <div className="p-5 space-y-3">
            <div>
              <label className="block text-sm mb-1">Description</label>
              <input
                value={charge.description}
                onChange={(e) => setCharge((c) => ({ ...c, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                placeholder="e.g. Room rent, Mini bar"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Amount</label>
                <input
                  type="number"
                  value={String(charge.amount)}
                  onChange={(e) => setCharge((c) => ({ ...c, amount: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Tax Amount</label>
                <input
                  type="number"
                  value={String(charge.taxAmount ?? "")}
                  onChange={(e) => setCharge((c) => ({ ...c, taxAmount: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowCharge(false)}
                className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={doAddCharge}
                className="rounded-lg px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500"
              >
                <CheckCircle2 className="inline mr-1" size={14} />
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Payment Modal */}
      {showPayment && (
        <Modal title="Add Payment" onClose={() => setShowPayment(false)}>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Amount</label>
                <input
                  type="number"
                  value={String(pay.amount)}
                  onChange={(e) => setPay((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Mode</label>
                <select
                  value={pay.modeId ?? ""}
                  onChange={(e) =>
                    setPay((p) => ({
                      ...p,
                      modeId: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {meta.paymentModes.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.mode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowPayment(false)}
                className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={doAddPayment}
                className="rounded-lg px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500"
              >
                <CheckCircle2 className="inline mr-1" size={14} />
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

/* --------------------------------- Modal --------------------------------- */
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={ref}
        className="relative z-[101] w-full max-w-2xl rounded-2xl border border-white/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl"
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
        <div className="max-h-[80vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}
