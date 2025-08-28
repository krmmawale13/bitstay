// apps/frontend/src/utils/inr.ts

/** INR-friendly currency formatter (no $ anywhere). */
export function formatINR(value?: number | string | null): string {
  if (value === null || value === undefined || value === "") return "₹0";
  const num = Number(value);
  if (!Number.isFinite(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

/** Parse a form input into a valid positive amount or throw. */
export function parseINRInput(input: any, opts?: { min?: number }) {
  const n = Number(input);
  if (!Number.isFinite(n)) throw new Error("Amount must be a valid number");
  const min = opts?.min ?? 0.01;
  if (n < min) throw new Error(`Amount must be at least ${min}`);
  return n;
}
