// apps/frontend/src/pages/bookings/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import bookingsService, { BookingStatus } from "@/services/bookings.service";
import { Card, CardHeader, Button, Input, Select, Badge, cx } from "@/components/ui";

type BookingDetail = {
  id: number;
  customer?: { id: number; name: string; phone?: string; email?: string };
  source?: { id: number; name: string };
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  rooms: { id: number; roomId: number; room: { id: number; number: string } }[];
  guests: { id: number; name: string; idTypeId?: number | null; idNumber?: string | null }[];
  payments: { id: number; amount: string; createdAt: string; mode?: { id: number; mode: string } }[];
  bookingcharge: { id: number; description: string; amount: string; taxAmount: string }[];
  roomAllocationHistory: { id: number; oldRoomId?: number | null; newRoomId?: number | null; changedAt: string }[];
  createdAt: string;
};

const TABS = ["Overview", "Guests", "Rooms", "Charges", "Payments", "History", "Bill"] as const;
type TabKey = typeof TABS[number];

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const fmt = (d: string | Date) => new Date(d).toLocaleString();

function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 ring-yellow-200",
    CONFIRMED: "bg-blue-100 text-blue-800 ring-blue-200",
    CHECKED_IN: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    CHECKED_OUT: "bg-gray-100 text-gray-800 ring-gray-200",
    CANCELLED: "bg-rose-100 text-rose-800 ring-rose-200",
  };
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", map[status])}>{status.replace("_", " ")}</span>;
}

export default function BookingDetailPage() {
  const router = useRouter();
  const id = Number(router.query.id);

  const [tab, setTab] = useState<TabKey>("Overview");
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ paymentModes: { id: number; mode: string }[] }>({ paymentModes: [] });

  const load = async () => {
    try {
      setLoading(true);
      const [b, m] = await Promise.all([bookingsService.get(id), bookingsService.getMeta()]);
      setBooking(b as any);
      setMeta({ paymentModes: m.paymentModes });
    } catch (e: any) {
      (window as any).__toast?.push?.({
        type: "error",
        message: "Couldn’t load booking",
        description: e?.response?.data?.message || e?.message || "Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totals = useMemo(() => {
    if (!booking) return { charges: 0, tax: 0, paid: 0, due: 0 };
    const charges = booking.bookingcharge.reduce((s, c) => s + Number(c.amount), 0);
    const tax = booking.bookingcharge.reduce((s, c) => s + Number(c.taxAmount), 0);
    const paid = booking.payments.reduce((s, p) => s + Number(p.amount), 0);
    return { charges, tax, paid, due: charges + tax - paid };
  }, [booking]);

  const actions = {
    checkIn: async () => {
      try {
        await bookingsService.checkIn(id);
        (window as any).__toast?.push?.({ type: "success", message: "Checked in" });
        load();
      } catch (e: any) {
        (window as any).__toast?.push?.({ type: "error", message: "Check-in failed", description: e?.response?.data?.message || e?.message });
      }
    },
    checkOut: async () => {
      try {
        await bookingsService.checkOut(id);
        (window as any).__toast?.push?.({ type: "success", message: "Checked out" });
        load();
      } catch (e: any) {
        (window as any).__toast?.push?.({ type: "error", message: "Check-out failed", description: e?.response?.data?.message || e?.message });
      }
    },
    cancel: async () => {
      try {
        await bookingsService.cancel(id);
        (window as any).__toast?.push?.({ type: "success", message: "Cancelled" });
        load();
      } catch (e: any) {
        (window as any).__toast?.push?.({ type: "error", message: "Cancel failed", description: e?.response?.data?.message || e?.message });
      }
    },
  };

  if (!Number.isFinite(id)) return null;

  return (
    <>
      <Head><title>Booking #{id}</title></Head>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Booking #{id}</h1>
            <p className="text-sm text-muted-foreground">Details, guests, rooms, payments & history.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/bookings" className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Back</Link>
          </div>
        </div>

        {/* Summary strip */}
        {booking && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card title="Status"><StatusBadge status={booking.status} /></Card>
            <Card title="Stay">{fmt(booking.checkIn)} → {fmt(booking.checkOut)}</Card>
            <Card title="Amount">{(totals.charges + totals.tax).toFixed(2)} <span className="text-xs text-gray-500">(incl. tax)</span></Card>
            <Card title="Due">
              <span className={cx("px-2 py-0.5 rounded-md text-sm", totals.due > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")}>
                {totals.due.toFixed(2)}
              </span>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {TABS.map((t) => (
            <button
              key={t}
              className={cx(
                "px-3 py-2 text-sm -mb-px border-b-2",
                tab === t ? "border-black font-medium" : "border-transparent text-gray-500 hover:text-black"
              )}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-2xl border bg-white/60 backdrop-blur p-5 shadow-sm">
          {loading && <p className="text-sm text-gray-500">Loading…</p>}
          {!loading && booking && (
            <>
              {tab === "Overview" && <OverviewTab booking={booking} actions={actions} />}
              {tab === "Guests" && <GuestsTab bookingId={id} guests={booking.guests} onChanged={load} />}
              {tab === "Rooms" && <RoomsTab booking={booking} onChanged={load} />}
              {tab === "Charges" && <ChargesTab bookingId={id} charges={booking.bookingcharge} totals={totals} onChanged={load} />}
              {tab === "Payments" && <PaymentsTab bookingId={id} payments={booking.payments} modes={meta.paymentModes} totals={totals} onChanged={load} />}
              {tab === "History" && <HistoryTab history={booking.roomAllocationHistory} />}
              {tab === "Bill" && <BillTab booking={booking} totals={totals} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- Small presentational helpers ---------- */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white/60 backdrop-blur p-4 shadow-sm">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

/* ---------- Tabs ---------- */

function OverviewTab({ booking, actions }: { booking: BookingDetail; actions: { checkIn: () => Promise<void>; checkOut: () => Promise<void>; cancel: () => Promise<void> } }) {
  const canCheckIn = booking.status === "CONFIRMED";
  const canCheckOut = booking.status === "CHECKED_IN";
  const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Customer">
          <div className="space-y-0.5">
            <div className="font-medium">{booking.customer?.name || "-"}</div>
            <div className="text-xs text-gray-500">{booking.customer?.email || "-"}</div>
            <div className="text-xs text-gray-500">{booking.customer?.phone || "-"}</div>
          </div>
        </Card>
        <Card title="Source">{booking.source?.name || "-"}</Card>
        <Card title="Rooms">{booking.rooms?.length ? booking.rooms.map((r) => r.room.number).join(", ") : "-"}</Card>
      </div>

      <div className="flex items-center gap-2">
        <button disabled={!canCheckIn} onClick={actions.checkIn} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">Check-in</button>
        <button disabled={!canCheckOut} onClick={actions.checkOut} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">Check-out</button>
        <button disabled={!canCancel} onClick={actions.cancel} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">Cancel</button>
      </div>
    </div>
  );
}

function GuestsTab({ bookingId, guests, onChanged }: { bookingId: number; guests: BookingDetail["guests"]; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [idTypeId, setIdTypeId] = useState<string>("");
  const [idNumber, setIdNumber] = useState("");

  const addGuest = async () => {
    if (!name.trim()) {
      (window as any).__toast?.push?.({ type: "error", message: "Name required" });
      return;
    }
    try {
      await bookingsService.addGuests(bookingId, {
        guests: [{ name, idTypeId: idTypeId ? Number(idTypeId) : undefined, idNumber: idNumber || undefined }],
      });
      (window as any).__toast?.push?.({ type: "success", message: "Guest added" });
      setName(""); setIdTypeId(""); setIdNumber("");
      onChanged();
    } catch (e: any) {
      (window as any).__toast?.push?.({ type: "error", message: "Add guest failed", description: e?.response?.data?.message || e?.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="ID Type ID (optional)" type="number" value={idTypeId} onChange={(e) => setIdTypeId(e.target.value)} />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="ID Number (optional)" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" onClick={addGuest}>+ Add guest</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="text-left text-gray-600"><th className="px-3 py-2">Name</th><th className="px-3 py-2">ID Type</th><th className="px-3 py-2">ID Number</th></tr></thead>
          <tbody>
            {guests.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={3}>No guests.</td></tr>
            ) : guests.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="px-3 py-2">{g.name}</td>
                <td className="px-3 py-2">{g.idTypeId ?? "-"}</td>
                <td className="px-3 py-2">{g.idNumber ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoomsTab({ booking, onChanged }: { booking: BookingDetail; onChanged: () => void }) {
  const [newRoomId, setNewRoomId] = useState<string>("");
  const [note, setNote] = useState("");

  const allocate = async () => {
    const id = Number(newRoomId);
    if (!Number.isFinite(id) || id <= 0) {
      (window as any).__toast?.push?.({ type: "error", message: "Enter a valid Room ID" });
      return;
    }
    try {
      await bookingsService.allocateRoom(booking.id, { newRoomId: id, note: note || undefined });
      (window as any).__toast?.push?.({ type: "success", message: "Room allocated" });
      setNewRoomId(""); setNote("");
      onChanged();
    } catch (e: any) {
      (window as any).__toast?.push?.({ type: "error", message: "Allocation failed", description: e?.response?.data?.message || e?.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="New Room ID" type="number" value={newRoomId} onChange={(e) => setNewRoomId(e.target.value)} />
          <input className="rounded-xl border px-3 py-2 text-sm md:col-span-2" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" onClick={allocate}>Allocate</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="text-left text-gray-600"><th className="px-3 py-2">Current Rooms</th></tr></thead>
          <tbody>
            {booking.rooms.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500">No room allocated.</td></tr>
            ) : (
              <tr><td className="px-3 py-2">{booking.rooms.map((r) => r.room.number).join(", ")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChargesTab({ bookingId, charges, totals, onChanged }: { bookingId: number; charges: BookingDetail["bookingcharge"]; totals: { charges: number; tax: number; paid: number; due: number }; onChanged: () => void }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [taxAmount, setTaxAmount] = useState<string>("");

  const addCharge = async () => {
    const amt = Number(amount);
    const tax = Number(taxAmount || 0);
    if (!description.trim() || !Number.isFinite(amt) || amt < 0) {
      (window as any).__toast?.push?.({ type: "error", message: "Description & valid amount required" });
      return;
    }
    try {
      await bookingsService.addCharge(bookingId, { description, amount: amt, taxAmount: tax });
      (window as any).__toast?.push?.({ type: "success", message: "Charge added" });
      setDescription(""); setAmount(""); setTaxAmount("");
      onChanged();
    } catch (e: any) {
      (window as any).__toast?.push?.({ type: "error", message: "Add charge failed", description: e?.response?.data?.message || e?.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Subtotal">{totals.charges.toFixed(2)}</Card>
        <Card title="Tax">{totals.tax.toFixed(2)}</Card>
        <Card title="Paid">{totals.paid.toFixed(2)}</Card>
        <Card title="Due">{totals.due.toFixed(2)}</Card>
      </div>

      <div className="rounded-xl border p-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input className="rounded-xl border px-3 py-2 text-sm md:col-span-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Tax amount" type="number" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" onClick={addCharge}>+ Add charge</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="text-left text-gray-600"><th className="px-3 py-2">Description</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Tax</th></tr></thead>
          <tbody>
            {charges.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={3}>No charges.</td></tr>
            ) : charges.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">{c.description}</td>
                <td className="px-3 py-2">{Number(c.amount).toFixed(2)}</td>
                <td className="px-3 py-2">{Number(c.taxAmount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsTab({ bookingId, payments, modes, totals, onChanged }: { bookingId: number; payments: BookingDetail["payments"]; modes: { id: number; mode: string }[]; totals: { due: number; paid: number; charges: number; tax: number }; onChanged: () => void }) {
  const [amount, setAmount] = useState<string>("");
  const [modeId, setModeId] = useState<string>("");

  const addPayment = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      (window as any).__toast?.push?.({ type: "error", message: "Enter valid amount" });
      return;
    }
    try {
      await bookingsService.addPayment(bookingId, { amount: amt, modeId: modeId ? Number(modeId) : undefined });
      (window as any).__toast?.push?.({ type: "success", message: "Payment recorded" });
      setAmount(""); setModeId("");
      onChanged();
    } catch (e: any) {
      (window as any).__toast?.push?.({ type: "error", message: "Add payment failed", description: e?.response?.data?.message || e?.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Total">{(totals.charges + totals.tax).toFixed(2)}</Card>
        <Card title="Paid">{totals.paid.toFixed(2)}</Card>
        <Card title="Due">{totals.due.toFixed(2)}</Card>
        <div className="rounded-2xl border bg-white/60 backdrop-blur p-4 shadow-sm">
          <div className="text-xs text-gray-500">Quick Pay</div>
          <div className="mt-2 flex gap-2">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <select className="rounded-xl border px-3 py-2 text-sm" value={modeId} onChange={(e) => setModeId(e.target.value)}>
              <option value="">Mode</option>
              {modes.map((m) => <option key={m.id} value={m.id}>{m.mode}</option>)}
            </select>
            <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" onClick={addPayment}>+ Add</button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="text-left text-gray-600"><th className="px-3 py-2">When</th><th className="px-3 py-2">Mode</th><th className="px-3 py-2">Amount</th></tr></thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={3}>No payments.</td></tr>
            ) : payments.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">{fmt(p.createdAt)}</td>
                <td className="px-3 py-2">{p.mode?.mode || "-"}</td>
                <td className="px-3 py-2">{Number(p.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryTab({ history }: { history: BookingDetail["roomAllocationHistory"] }) {
  return (
    <div className="space-y-2">
      {history.length === 0 ? (
        <p className="text-sm text-gray-500">No room allocation changes yet.</p>
      ) : (
        <ul className="space-y-2">
          {history.map((h) => (
            <li key={h.id} className="rounded-xl border p-3">
              <div className="text-sm">
                {fmt(h.changedAt)} — {h.oldRoomId ? `Room ${h.oldRoomId}` : "Unassigned"} → {h.newRoomId ? `Room ${h.newRoomId}` : "Unassigned"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BillTab({ booking, totals }: { booking: BookingDetail; totals: { charges: number; tax: number; paid: number; due: number } }) {
  // Placeholder: when Invoices module is ready, link/show invoice lines with HSN/GST
  return (
    <div className="space-y-3">
      <div className="rounded-xl border p-3 bg-white/50">
        <div className="text-sm">
          <div>Customer: <span className="font-medium">{booking.customer?.name || "-"}</span></div>
          <div>Stay: {fmt(booking.checkIn)} → {fmt(booking.checkOut)}</div>
          <div>Status: <StatusBadge status={booking.status} /></div>
        </div>
      </div>
      <div className="rounded-xl border p-3">
        <div className="font-medium mb-2">Bill Summary (provisional)</div>
        <div className="text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{totals.charges.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>GST</span><span>{totals.tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span>{(totals.charges + totals.tax).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Paid</span><span>{totals.paid.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Due</span><span>{totals.due.toFixed(2)}</span></div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          HSN/SAC & GST itemization will appear here once the invoice is generated (Invoices module).
        </p>
      </div>
    </div>
  );
}
