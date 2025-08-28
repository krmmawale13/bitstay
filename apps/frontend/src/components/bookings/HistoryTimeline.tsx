// apps/frontend/src/components/bookings/HistoryTimeline.tsx
import {
  CalendarClock,
  BedSingle,
  Receipt,
  Wallet,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Dot,
} from "lucide-react";

/** INR-friendly currency formatter (no $ anywhere) */
function formatINR(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "₹0";
  const num = Number(value);
  if (!Number.isFinite(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

/** tiny date helper */
function fmtDateTime(iso?: string | Date | null) {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

/** infer status label/icon */
function statusPill(status?: string) {
  switch (status) {
    case "CONFIRMED":
      return {
        icon: <CheckCircle2 size={14} />,
        cls: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-800",
        text: "Confirmed",
      };
    case "CHECKED_IN":
      return {
        icon: <CheckCircle2 size={14} />,
        cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800",
        text: "Checked-in",
      };
    case "CHECKED_OUT":
      return {
        icon: <CheckCircle2 size={14} />,
        cls: "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
        text: "Checked-out",
      };
    case "CANCELLED":
      return {
        icon: <XCircle size={14} />,
        cls: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-800",
        text: "Cancelled",
      };
    case "PENDING":
    default:
      return {
        icon: <Dot size={14} />,
        cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800",
        text: "Pending",
      };
  }
}

type TimelineEvent =
  | {
      type: "created";
      at?: string;
      by?: string | null;
    }
  | {
      type: "room";
      at?: string;
      oldRoomId?: number | null;
      newRoomId?: number | null;
    }
  | {
      type: "charge";
      at?: string;
      description: string;
      amount: number | string;
      taxAmount?: number | string;
    }
  | {
      type: "payment";
      at?: string;
      amount: number | string;
      mode?: string | null;
    }
  | {
      type: "status";
      at?: string;
      status: string;
    };

export default function HistoryTimeline({
  booking,
}: {
  booking: any; // shape from bookingsService.get(): includes charges, payments, roomAllocationHistory
}) {
  // Build a mixed event stream. We don't have discrete status-change timestamps in DB,
  // so we show current status as a terminal pill in header (outside), and timeline covers
  // creation + charges + payments + allocations.
  const events: TimelineEvent[] = [];

  // created
  events.push({
    type: "created",
    at: booking?.createdAt,
  });

  // room allocations
  if (Array.isArray(booking?.roomAllocationHistory)) {
    for (const h of booking.roomAllocationHistory) {
      events.push({
        type: "room",
        at: h.createdAt,
        oldRoomId: h.oldRoomId ?? null,
        newRoomId: h.newRoomId ?? null,
      });
    }
  }

  // charges
  if (Array.isArray(booking?.bookingcharge)) {
    for (const c of booking.bookingcharge) {
      events.push({
        type: "charge",
        at: c.createdAt,
        description: c.description,
        amount: c.amount,
        taxAmount: c.taxAmount,
      });
    }
  }

  // payments
  if (Array.isArray(booking?.payments)) {
    for (const p of booking.payments) {
      events.push({
        type: "payment",
        at: p.createdAt,
        amount: p.amount,
        mode: p.mode?.mode ?? null,
      });
    }
  }

  // optional: if you want to show current status as last event
  if (booking?.status) {
    events.push({
      type: "status",
      at: booking?.updatedAt ?? booking?.createdAt,
      status: booking.status,
    });
  }

  // sort by time asc
  events.sort((a, b) => {
    const ta = new Date((a as any).at ?? 0).getTime();
    const tb = new Date((b as any).at ?? 0).getTime();
    return ta - tb;
  });

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Activity Timeline</h2>
        {/* status pill (current) */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ring-1 ${
            statusPill(booking?.status).cls
          }`}
        >
          {statusPill(booking?.status).icon}
          {statusPill(booking?.status).text}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-sm text-slate-500">No activity yet.</div>
      ) : (
        <ul className="relative ml-3">
          {/* vertical line */}
          <div className="absolute left-[-1px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
          {events.map((ev, idx) => {
            return (
              <li key={idx} className="relative pl-6 py-3">
                {/* dot */}
                <span className="absolute left-[-5px] top-4 h-2.5 w-2.5 rounded-full bg-blue-500 shadow" />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 p-2">
                    {iconFor(ev)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {titleFor(ev)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {subFor(ev)}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">{fmtDateTime((ev as any).at)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function iconFor(ev: TimelineEvent) {
  switch (ev.type) {
    case "created":
      return <CalendarClock size={16} />;
    case "room":
      return <ArrowRightLeft size={16} />;
    case "charge":
      return <Receipt size={16} />;
    case "payment":
      return <Wallet size={16} />;
    case "status":
      return ev.status === "CANCELLED" ? <XCircle size={16} /> : <CheckCircle2 size={16} />;
    default:
      return <Dot size={16} />;
  }
}

function titleFor(ev: TimelineEvent) {
  switch (ev.type) {
    case "created":
      return "Booking created";
    case "room": {
      const oldTxt = typeof ev.oldRoomId === "number" ? `#${ev.oldRoomId}` : "—";
      const newTxt = typeof ev.newRoomId === "number" ? `#${ev.newRoomId}` : "—";
      return `Room reallocated ${oldTxt} → ${newTxt}`;
    }
    case "charge":
      return `Charge added: ${formatINR(ev.amount)}`;
    case "payment":
      return `Payment received: ${formatINR(ev.amount)}`;
    case "status":
      return `Status: ${ev.status.replace(/_/g, " ")}`;
    default:
      return "Event";
  }
}

function subFor(ev: TimelineEvent) {
  switch (ev.type) {
    case "created":
      return "Initial record created";
    case "room":
      return "Allocation history entry";
    case "charge": {
      const tax = ev.taxAmount ? ` + tax ${formatINR(ev.taxAmount)}` : "";
      return `Details recorded${tax}`;
    }
    case "payment": {
      const mode = ev.mode ? ` via ${ev.mode}` : "";
      return `Recorded${mode}`;
    }
    case "status":
      return "Latest known status";
    default:
      return "";
  }
}
