// apps/frontend/src/lib/booking.util.ts

/* ---------- currency & numbers (INR-first) ---------- */

/** Format number as INR (₹), no currency sign if you pass opts.symbol = false */
export function inr(
  value: number | string | null | undefined,
  opts?: { symbol?: boolean; minFrac?: number; maxFrac?: number }
) {
  const symbol = opts?.symbol !== false; // default true
  const minFrac = opts?.minFrac ?? 0;
  const maxFrac = opts?.maxFrac ?? 2;

  const n = coerceNumber(value);
  if (!Number.isFinite(n)) return symbol ? "₹—" : "—";

  const fmt = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
  }).format(n);

  return symbol ? fmt : fmt.replace(/^₹\s?/, "");
}

/** Turn UI strings like "₹2,000", "2 500" into a number */
export function coerceNumber(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return NaN;
  if (typeof v === "number") return v;
  const cleaned = v.replace(/[₹,\s]/g, "");
  const n = Number(cleaned);
  return n;
}

/* ---------- dates & time ---------- */

export function fmtDate(iso?: string | Date | null) {
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString();
}

export function fmtDateTime(iso?: string | Date | null) {
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleString();
}

export function toDate(iso?: string | Date | null): Date | null {
  if (!iso) return null;
  const d = iso instanceof Date ? iso : new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* ---------- booking status helpers ---------- */

export type FEBookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED";

export function statusLabel(s?: FEBookingStatus | string) {
  switch (s) {
    case "PENDING":
      return "Pending";
    case "CONFIRMED":
      return "Confirmed";
    case "CHECKED_IN":
      return "Checked-in";
    case "CHECKED_OUT":
      return "Checked-out";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "—";
  }
}

/** Tailwind chip classes for status */
export function statusChipClass(s?: FEBookingStatus | string) {
  switch (s) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:ring-amber-800";
    case "CONFIRMED":
      return "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-200 dark:ring-sky-800";
    case "CHECKED_IN":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:ring-emerald-800";
    case "CHECKED_OUT":
      return "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800/30 dark:text-slate-200 dark:ring-slate-700";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:ring-rose-800";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-800/30 dark:text-slate-300 dark:ring-slate-700";
  }
}

/* ---------- tiny UI helpers ---------- */

export function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/** Currency prefix for input fields: returns "₹" */
export function currencyPrefix() {
  return "₹";
}
