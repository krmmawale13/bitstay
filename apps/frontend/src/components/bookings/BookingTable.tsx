// apps/frontend/src/components/bookings/BookingTable.tsx
import Link from "next/link";
import { Eye } from "lucide-react";

/* ---------------- types ---------------- */
export type BookingRow = {
  id: number;
  customer?: { name?: string | null } | null;
  checkIn?: string | null;
  checkOut?: string | null;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  rooms?: Array<{
    id: number;
    roomId?: number | null;
    room?: {
      number?: string | number | null;
      rate?: number | null;
      type?: { id: number; name: string } | null;
      hotel?: { id: number; name: string } | null;
    } | null;
  }>;
};

export type BookingTableProps = {
  rows: BookingRow[];
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  perPage?: number; // only for the footer text; table already receives paged rows
};

/* ---------------- utils ---------------- */
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function fmtDateShort(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

/* ---------------- status chip ---------------- */
function StatusChip({ status }: { status: BookingRow["status"] }) {
  const map: Record<
    BookingRow["status"],
    { text: string; ring: string; bg: string; fg: string }
  > = {
    PENDING: {
      text: "Pending",
      ring: "ring-amber-200 dark:ring-amber-800",
      bg: "bg-amber-50 dark:bg-amber-900/30",
      fg: "text-amber-700 dark:text-amber-200",
    },
    CONFIRMED: {
      text: "Confirmed",
      ring: "ring-blue-200 dark:ring-blue-800",
      bg: "bg-blue-50 dark:bg-blue-900/30",
      fg: "text-blue-700 dark:text-blue-200",
    },
    CHECKED_IN: {
      text: "Checked-in",
      ring: "ring-emerald-200 dark:ring-emerald-800",
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      fg: "text-emerald-700 dark:text-emerald-200",
    },
    CHECKED_OUT: {
      text: "Checked-out",
      ring: "ring-slate-200 dark:ring-slate-700",
      bg: "bg-slate-50 dark:bg-slate-800",
      fg: "text-slate-700 dark:text-slate-300",
    },
    CANCELLED: {
      text: "Cancelled",
      ring: "ring-rose-200 dark:ring-rose-800",
      bg: "bg-rose-50 dark:bg-rose-900/30",
      fg: "text-rose-700 dark:text-rose-200",
    },
  };
  const s = map[status];
  return (
    <span
      className={cls(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs ring-1",
        s.bg,
        s.fg,
        s.ring
      )}
      title={status}
    >
      {s.text}
    </span>
  );
}

/* ---------------- table ---------------- */
export default function BookingTable({
  rows,
  page,
  totalPages,
  onPrev,
  onNext,
  perPage = 20,
}: BookingTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
      {rows.length === 0 ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          No bookings found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                <tr className="text-left">
                  <Th>#</Th>
                  <Th>Customer</Th>
                  <Th>Dates</Th>
                  <Th>Rooms</Th>
                  <Th>Status</Th>
                  <Th className="text-center">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <Td>#{b.id}</Td>
                    <Td className="font-medium text-slate-900 dark:text-slate-100">
                      {b.customer?.name || "—"}
                    </Td>
                    <Td className="text-slate-700 dark:text-slate-300">
                      <div className="flex flex-col">
                        <span title={b.checkIn ?? ""}>{fmtDateShort(b.checkIn)}</span>
                        <span className="text-xs text-slate-500" title={b.checkOut ?? ""}>
                          {fmtDateShort(b.checkOut)}
                        </span>
                      </div>
                    </Td>
                    <Td className="text-slate-700 dark:text-slate-300">
                      {(b.rooms ?? []).length === 0 ? (
                        "—"
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(b.rooms ?? []).map((x) => (
                            <span
                              key={x.id}
                              className="inline-flex items-center rounded-md bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-xs ring-1 ring-slate-200 dark:ring-slate-700"
                              title={[
                                x.room?.type?.name && `Type: ${x.room.type.name}`,
                                x.room?.hotel?.name && `Hotel: ${x.room.hotel.name}`,
                                (x.room?.rate ?? null) !== null && `₹${x.room?.rate}`,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            >
                              #{x.room?.number ?? x.roomId}
                            </span>
                          ))}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <StatusChip status={b.status} />
                    </Td>
                    <Td className="text-center">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm"
                        title="View"
                      >
                        <Eye size={16} />
                        View
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-sm">
            <div className="text-slate-600 dark:text-slate-300">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> •{" "}
              Showing <strong>{(page - 1) * perPage + 1}-{Math.min(page * perPage, page * perPage /* placeholder text only */)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onPrev}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
              >
                Prev
              </button>
              <button
                onClick={onNext}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- tiny cells ---------- */
function Th(
  { children, className = "", ...rest }:
  React.ThHTMLAttributes<HTMLTableHeaderCellElement>
) {
  return (
    <th
      {...rest}
      className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}
function Td(
  { children, className = "", colSpan, ...rest }:
  React.TdHTMLAttributes<HTMLTableCellElement>
) {
  return (
    <td
      {...rest}
      colSpan={colSpan}
      className={`whitespace-nowrap px-4 py-3 ${className}`}
    >
      {children}
    </td>
  );
}
