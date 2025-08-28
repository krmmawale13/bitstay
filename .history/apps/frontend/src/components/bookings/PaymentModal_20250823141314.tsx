// apps/frontend/src/components/bookings/PaymentModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import bookingsService, { type AddPaymentInput } from "@/services/bookings.service";
import {
  IndianRupee,
  CreditCard,
  Save,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";

/** Non-breaking toast helper (uses window.__toast if present). */
function notify(
  type: "success" | "error" | "info",
  message: string,
  description?: string
) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  if (api?.push) api.push({ type, message, description });
  else console.log(`[toast:${type}]`, message, description ?? "");
}

type Mode = { id: number; mode: string };

export default function PaymentModal({
  bookingId,
  paymentModes,
  onAdded,
  onClose,
  preset,
}: {
  bookingId: number;
  /** pass from bookingsService.getMeta().paymentModes */
  paymentModes: Mode[];
  /** optional preset values when coming from POS/quick-pay */
  preset?: Partial<AddPaymentInput>;
  onAdded?: () => void;
  onClose: () => void;
}) {
  const [modeId, setModeId] = useState<string>(
    typeof preset?.modeId === "number" ? String(preset.modeId) : paymentModes[0]?.id ? String(paymentModes[0].id) : ""
  );
  const [amount, setAmount] = useState<string>(
    preset?.amount !== undefined ? String(preset.amount) : ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // autofocus amount
  const amtRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    setTimeout(() => amtRef.current?.focus(), 50);
  }, []);

  // close on outside click / ESC
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const parsedAmount = useMemo(() => {
    if (amount.trim() === "") return null;
    const n = Number(amount);
    return Number.isNaN(n) ? NaN : n;
  }, [amount]);

  function validate(): string[] {
    const errs: string[] = [];
    if (!modeId) errs.push("Please select a payment mode.");
    if (parsedAmount === null || Number.isNaN(parsedAmount))
      errs.push("Amount must be a valid number.");
    if (typeof parsedAmount === "number") {
      if (parsedAmount < 0.01)
        errs.push("Amount must be at least ₹0.01.");
      // suggest 2 decimals (not hard fail)
      if (!Number.isInteger(parsedAmount * 100))
        errs.push("Amount should have at most 2 decimal places.");
    }
    return errs;
  }

  async function handleSave() {
    setError(null);
    const errs = validate();
    if (errs.length) {
      const msg = errs.join("\n");
      setError(msg);
      notify("error", "Validation failed", errs[0]);
      return;
    }
    try {
      setBusy(true);
      const payload: AddPaymentInput = {
        amount: parsedAmount as number,
        modeId: Number(modeId),
      };
      await bookingsService.addPayment(bookingId, payload);
      notify("success", "Payment added");
      onAdded?.();
      onClose();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to add payment. Please try again.";
      setError(msg);
      notify("error", "Add payment failed", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={panelRef}
        className="relative z-[101] w-full max-w-md rounded-2xl border border-white/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/20 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center">
              <CreditCard size={16} />
            </div>
            <div className="text-sm font-semibold">Add Payment (₹)</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-3 text-sm text-rose-800 bg-rose-50 border-b border-rose-200 whitespace-pre-line">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Payment Mode</label>
            <select
              value={modeId}
              onChange={(e) => setModeId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              {paymentModes.length === 0 ? (
                <option value="">No modes configured</option>
              ) : null}
              {paymentModes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.mode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Amount (₹)</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <IndianRupee size={14} />
              </span>
              <input
                ref={amtRef}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 px-3 py-2 text-sm"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Minimum ₹0.01. Use two decimals (e.g., 1999.00).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/20 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white shadow-sm
                       bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
