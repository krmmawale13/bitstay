// apps/frontend/src/components/bookings/ChargeModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import bookingsService, { type AddChargeInput } from "@/services/bookings.service";
import { ReceiptIndianRupee, Save, X, AlertCircle, Loader2 } from "lucide-react";

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

export default function ChargeModal({
  bookingId,
  onAdded,
  onClose,
  preset,
}: {
  bookingId: number;
  /** optional preset values (e.g., POS line → description/amount) */
  preset?: Partial<AddChargeInput>;
  onAdded?: () => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState(preset?.description ?? "");
  const [amount, setAmount] = useState<string>(
    preset?.amount !== undefined ? String(preset.amount) : ""
  );
  const [taxAmount, setTaxAmount] = useState<string>(
    preset?.taxAmount !== undefined ? String(preset.taxAmount) : ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // focus description on open
  const descRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    setTimeout(() => descRef.current?.focus(), 50);
  }, []);

  const parsed = useMemo(() => {
    const toNum = (v: string) => (v.trim() === "" ? null : Number(v));
    return {
      amount: toNum(amount),
      taxAmount: toNum(taxAmount),
    };
  }, [amount, taxAmount]);

  function validate() {
    const errs: string[] = [];
    const a = parsed.amount;
    const t = parsed.taxAmount;

    if (!description.trim()) errs.push("Description is required.");
    if (a === null || Number.isNaN(a)) errs.push("Amount must be a valid number.");
    if (a !== null && a < 0) errs.push("Amount must not be negative.");
    // BE allows 0 for charges (unlike payments). Keep >= 0.
    if (t !== null && Number.isNaN(t)) errs.push("Tax amount must be a valid number.");
    if (t !== null && t < 0) errs.push("Tax amount must not be negative.");

    // (optional) 2-decimal precision hint; not hard fail
    const tooManyDecimals = (n: number) => !Number.isInteger(n * 100);
    if (a !== null && tooManyDecimals(a)) {
      errs.push("Amount should have at most 2 decimal places.");
    }
    if (t !== null && tooManyDecimals(t)) {
      errs.push("Tax amount should have at most 2 decimal places.");
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
      const payload: AddChargeInput = {
        description: description.trim(),
        amount: parsed.amount as number,
        taxAmount: parsed.taxAmount ?? undefined,
      };
      await bookingsService.addCharge(bookingId, payload);
      notify("success", "Charge added");
      onAdded?.();
      onClose();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to add charge. Please try again.";
      setError(msg);
      notify("error", "Add charge failed", msg);
    } finally {
      setBusy(false);
    }
  }

  // close on outside click/ESC
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDown = (ev: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(ev.target as Node)) onClose();
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={panelRef}
        className="relative z-[101] w-full max-w-lg rounded-2xl border border-white/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl"
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/20 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center">
              <ReceiptIndianRupee size={16} />
            </div>
            <div className="text-sm font-semibold">Add Charge (₹)</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* error */}
        {error && (
          <div className="px-5 py-3 text-sm text-rose-800 bg-rose-50 border-b border-rose-200 whitespace-pre-line">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* form */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Description</label>
            <input
              ref={descRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Room service, Mini-bar, Laundry"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Amount (₹)</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  ₹
                </span>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-7 px-3 py-2 text-sm"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Enter base amount; taxes can be separate.
              </p>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Tax Amount (₹, optional)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  ₹
                </span>
                <input
                  inputMode="decimal"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-7 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            Tip: For POS-driven charges, pass a <code>preset</code> with item label and
            price. This modal only pushes a summarized line to the booking; line-item
            details remain in POS.
          </div>
        </div>

        {/* footer */}
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
                       bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
