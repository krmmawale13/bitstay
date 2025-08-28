// apps/frontend/src/components/bookings/GuestEditor.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import bookingsService, {
  type BookingGuestInput,
} from "@/services/bookings.service";
import {
  IdCard,
  UserPlus,
  Trash2,
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

type IdType = { id: number; name: string };

type Row = {
  name: string;
  idTypeId?: number | null;
  idNumber?: string | null;
  // NOTE: gender is NOT persisted in BookingGuest schema; skip to avoid confusion.
  // gender?: "Male" | "Female" | "Other";
};

export default function GuestEditor({
  bookingId,
  idTypes,
  onAdded,
  onClose,
  preset,
}: {
  bookingId: number;
  /** pass from bookingsService.getMeta().idTypes */
  idTypes: IdType[];
  /** optional preset rows (e.g. carry-over from customer) */
  preset?: Partial<BookingGuestInput>[];
  onAdded?: () => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(
    preset && preset.length
      ? preset.map((g) => ({
          name: g.name ?? "",
          idTypeId:
            typeof g.idTypeId === "number" ? g.idTypeId : (undefined as number | undefined),
          idNumber: g.idNumber ?? "",
        }))
      : [{ name: "", idTypeId: undefined, idNumber: "" }]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // autofocus first input
  const firstRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    setTimeout(() => firstRef.current?.focus(), 50);
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

  function addRow() {
    setRows((r) => [...r, { name: "", idTypeId: undefined, idNumber: "" }]);
  }
  function removeRow(idx: number) {
    setRows((r) => (r.length <= 1 ? r : r.filter((_, i) => i !== idx)));
  }
  function update(idx: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  const problems = useMemo(() => {
    const errs: string[] = [];
    if (rows.length === 0) errs.push("Add at least one guest.");
    rows.forEach((r, i) => {
      if (!r.name?.trim()) errs.push(`Row ${i + 1}: Name is required.`);
      const hasType = typeof r.idTypeId === "number";
      const hasNum = !!r.idNumber?.trim();
      if (hasType && !hasNum)
        errs.push(`Row ${i + 1}: ID number is required when ID type is selected.`);
      if (hasNum && !hasType)
        errs.push(`Row ${i + 1}: Select an ID type when ID number is provided.`);
    });
    return errs;
  }, [rows]);

  async function handleSave() {
    setError(null);
    if (problems.length) {
      const m = problems.join("\n");
      setError(m);
      notify("error", "Validation failed", problems[0]);
      return;
    }
    try {
      setBusy(true);
      const guests: BookingGuestInput[] = rows.map((r) => ({
        name: r.name.trim(),
        idTypeId: typeof r.idTypeId === "number" ? r.idTypeId : undefined,
        idNumber: r.idNumber?.trim() ? r.idNumber.trim() : undefined,
      }));
      await bookingsService.addGuests(bookingId, { guests });
      notify("success", "Guests added");
      onAdded?.();
      onClose();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to add guests. Please try again.";
      setError(msg);
      notify("error", "Add guests failed", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={panelRef}
        className="relative z-[101] w-full max-w-2xl rounded-2xl border border-white/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/20 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center">
              <UserPlus size={16} />
            </div>
            <div className="text-sm font-semibold">Add Guests</div>
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

        {/* Table-like rows */}
        <div className="p-5">
          <div className="grid grid-cols-12 gap-2 text-xs text-slate-500 mb-2">
            <div className="col-span-5">Guest Name *</div>
            <div className="col-span-3">ID Type</div>
            <div className="col-span-3">ID Number</div>
            <div className="col-span-1 text-right">—</div>
          </div>

          <div className="space-y-2">
            {rows.map((r, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-2"
              >
                <div className="col-span-5">
                  <input
                    ref={idx === 0 ? firstRef : undefined}
                    value={r.name}
                    onChange={(e) => update(idx, { name: e.target.value })}
                    placeholder="Full name"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <div className="col-span-3">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <IdCard size={14} />
                    </span>
                    <select
                      value={typeof r.idTypeId === "number" ? String(r.idTypeId) : ""}
                      onChange={(e) =>
                        update(idx, {
                          idTypeId: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 px-3 py-2 text-sm"
                    >
                      <option value="">Select</option>
                      {idTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-span-3">
                  <input
                    value={r.idNumber ?? ""}
                    onChange={(e) => update(idx, { idNumber: e.target.value })}
                    placeholder="Document no."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  <button
                    onClick={() => removeRow(idx)}
                    disabled={rows.length <= 1}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
                    title="Remove row"
                  >
                    <Trash2 size={8} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button
              onClick={addRow}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-900 bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:ring-slate-700"
            >
              <UserPlus size={16} />
              Add another guest
            </button>
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
