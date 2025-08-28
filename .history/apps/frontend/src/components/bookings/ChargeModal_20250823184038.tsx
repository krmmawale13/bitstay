import { useEffect, useMemo, useRef, useState } from "react";
import bookingsService from "@/services/bookings.service";
import { X, Percent, IndianRupee, Calculator } from "lucide-react";

/** toast helper */
function notify(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

type Slab = { id: number; code?: string; name?: string; taxPercent: number };

export default function ChargeModal({
  bookingId,
  // accept either prop name; both optional & back-compatible
  hsnSlabs,
  gstSlabs,
  preset,
  onAdded,
  onClose,
}: {
  bookingId: number;
  hsnSlabs?: Slab[];
  gstSlabs?: Slab[];
  preset?: Partial<{ description: string; amount: number | string; taxAmount?: number | string }>;
  onAdded?: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // normalize slabs from either prop
  const slabs: Slab[] = useMemo(() => {
    const raw = (hsnSlabs ?? gstSlabs ?? []) as any[];
    return Array.isArray(raw)
      ? raw.map((s) => ({
          id: s.id,
          code: s.code ?? s.hsnCode ?? s.hsn ?? undefined,
          name: s.name ?? s.description ?? undefined,
          taxPercent: Number(s.taxPercent ?? s.rate ?? s.gst ?? 0),
        }))
      : [];
  }, [hsnSlabs, gstSlabs]);

  // form
  const [description, setDescription] = useState(preset?.description ?? "");
  const [amount, setAmount] = useState<string>(preset?.amount ? String(preset.amount) : "");
  const [gstMode, setGstMode] = useState<"none" | "slab" | "percent">(slabs.length ? "slab" : "none");
  const [slabId, setSlabId] = useState<number | "">("");
  const [gstPercent, setGstPercent] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // close on outside
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  const parsedAmount = useMemo(() => {
    const cleaned = String(amount || "").replace(/[₹,\s]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }, [amount]);

  const selectedSlab = useMemo(() => {
    if (!slabs.length || !slabId) return undefined;
    return slabs.find((s) => s.id === Number(slabId));
  }, [slabs, slabId]);

  const effectivePercent = useMemo(() => {
    if (gstMode === "slab") return selectedSlab?.taxPercent ?? 0;
    if (gstMode === "percent") {
      const n = Number(String(gstPercent).replace(/[^\d.]/g, ""));
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    }
    return 0;
  }, [gstMode, selectedSlab, gstPercent]);

  const taxAmount = useMemo(() => parsedAmount * (effectivePercent / 100), [parsedAmount, effectivePercent]);
  const total = useMemo(() => parsedAmount + taxAmount, [parsedAmount, taxAmount]);

  async function onSave() {
    if (!description.trim()) {
      notify("error", "Description is required");
      return;
    }
    if (parsedAmount <= 0) {
      notify("error", "Amount must be greater than 0");
      return;
    }
    try {
      setBusy(true);
      await bookingsService.addCharge(bookingId, {
        description: description.trim(),
        amount: parsedAmount,
        taxAmount: gstMode === "none" ? 0 : taxAmount,
      });
      notify("success", "Charge added");
      onClose();
      onAdded?.();
    } catch (e: any) {
      notify("error", "Add charge failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={panelRef}
        className="relative z-[101] w-full max-w-lg rounded-2xl border border-white/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/20 dark:border-slate-800">
          <div className="text-sm font-semibold">Add Charge</div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900"
              placeholder="e.g. Room service, Minibar, Laundry"
            />
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              Amount <IndianRupee size={14} className="text-slate-400" />
            </label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900"
              placeholder="₹0.00"
            />
          </div>

          {/* GST mode */}
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">
              GST <Percent size={14} className="text-slate-400" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="gstmode" checked={gstMode === "none"} onChange={() => setGstMode("none")} />
                None
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="gstmode"
                  checked={gstMode === "slab"}
                  onChange={() => setGstMode("slab")}
                  disabled={!slabs.length}
                />
                HSN/GST Slab {!slabs.length && <span className="text-xs text-slate-500">(not available)</span>}
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="gstmode" checked={gstMode === "percent"} onChange={() => setGstMode("percent")} />
                Manual %
              </label>
            </div>

            {gstMode === "slab" && slabs.length > 0 && (
              <select
                value={slabId}
                onChange={(e) => setSlabId(e.target.value ? (Number(e.target.value) as any) : "")}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                title="Select slab"
              >
                <option value="">Select slab</option>
                {slabs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code ? `${s.code} — ` : ""}{s.name ?? "HSN"} — {s.taxPercent}%
                  </option>
                ))}
              </select>
            )}

            {gstMode === "percent" && (
              <div className="relative">
                <input
                  value={gstPercent}
                  onChange={(e) => setGstPercent(e.target.value)}
                  placeholder="e.g. 18"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-2 text-sm"
                />
                <Percent size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-sm bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span>Base</span>
              <span>₹{parsedAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>GST ({effectivePercent.toFixed(2)}%)</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between font-semibold">
              <span className="inline-flex items-center gap-1"><Calculator size={14}/> Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/20 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={busy}
            className="rounded-lg px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
