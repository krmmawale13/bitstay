// apps/frontend/src/components/bookings/GuestEditor.tsx
import { useEffect, useMemo, useState } from "react";
import bookingsService, {
  type BookingGuestInput,
} from "@/services/bookings.service";
import {
  UserPlus,
  UserMinus,
  IdCard,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Lock,
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

export default function GuestEditor({
  bookingId,
  idTypes,
  existingGuests,
  onAdded, // called after API success (parent can refresh booking)
}: {
  bookingId: number;
  idTypes: IdType[];
  existingGuests?: Array<{
    id: number;
    name: string;
    idType?: { id: number; name: string } | null;
    idNumber?: string | null;
  }> | null;
  onAdded?: () => void;
}) {
  const [rows, setRows] = useState<BookingGuestInput[]>([
    { name: "", idTypeId: undefined, idNumber: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // quick map for idType label
  const idTypeMap = useMemo(() => {
    const m = new Map<number, string>();
    (idTypes || []).forEach((t) => m.set(t.id, t.name));
    return m;
  }, [idTypes]);

  function addRow() {
    setRows((x) => [...x, { name: "", idTypeId: undefined, idNumber: "" }]);
  }
  function delRow(idx: number) {
    setRows((x) => x.filter((_, i) => i !== idx));
  }
  function upd<K extends keyof BookingGuestInput>(
    idx: number,
    key: K,
    val: BookingGuestInput[K]
  ) {
    setRows((x) => x.map((r, i) => (i === idx ? { ...r, [key]: val } : r)));
  }

  // basic validation: name required, idNumber required if idType selected
  function validate(): string[] {
    const errs: string[] = [];
    rows.forEach((r, i) => {
      const rowNo = i + 1;
      if (!r.name || !r.name.trim()) errs.push(`Row ${rowNo}: name is required`);
      if (r.idTypeId && !r.idNumber)
        errs.push(`Row ${rowNo}: ID number required for selected ID type`);
    });
    if (rows.length === 0) errs.push("Add at least one guest");
    return errs;
  }

  async function save() {
    setError(null);
    const errs = validate();
    if (errs.length) {
      setError(errs.join("\n"));
      notify("error", "Validation failed", errs[0]);
      return;
    }
    try {
      setBusy(true);
      const payload = rows.map((r) => ({
        name: r.name.trim(),
        idTypeId: r.idTypeId ?? null,
        idNumber: r.idNumber?.trim() || null,
      }));
      await bookingsService.addGuests(bookingId, payload);
      notify("success", "Guests added");
      setRows([{ name: "", idTypeId: undefined, idNumber: "" }]);
      onAdded?.();
    } catch (e: any) {
      notify("error", "Add guests failed", e?.message);
      setError(e?.message || "Failed to add guests");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/70 shadow-sm">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center">
            <UserPlus size={16} />
          </div>
          <div className="text-sm font-semibold">Guests</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm
                     ring-1 ring-slate-200 bg-white hover:bg-slate-50
                     dark:ring-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <Plus size={14} />
            Add row
          </button>
          <button
            onClick={save}
            disabled={busy || rows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white shadow-sm
                       bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>

      {/* error */}
      {error && (
        <div className="px-4 py-3 text-sm text-rose-800 bg-rose-50 border-t border-b border-rose-200 whitespace-pre-line">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* existing guests (read-only delete, until backend supports) */}
      {existingGuests && existingGuests.length > 0 && (
        <div className="px-4 pt-4">
          <div className="text-xs font-semibold text-slate-500 mb-2">Existing</div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {existingGuests.map((g) => (
              <li
                key={g.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {g.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <IdCard size={14} />
                    <span>
                      {g.idType?.name ? g.idType.name : "—"}{" "}
                      {g.idNumber ? `• ${g.idNumber}` : ""}
                    </span>
                  </div>
                </div>
                <div
                  title="Removal of existing guests isn’t enabled yet"
                  className="inline-flex items-center gap-1 text-xs text-slate-500"
                >
                  <Lock size={14} /> Locked
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* editor rows */}
      <div className="p-4 space-y-3">
        <div className="text-xs font-semibold text-slate-500">Add new</div>
        {rows.length === 0 ? (
          <div className="text-sm text-slate-500">No pending rows. Add one.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((r, idx) => (
              <div
                key={idx}
                className="grid gap-2 sm:grid-cols-6 items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
              >
                {/* name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Full name</label>
                  <input
                    value={r.name}
                    onChange={(e) => upd(idx, "name", e.target.value)}
                    placeholder="Guest name"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                {/* id type */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">ID Type</label>
                  <select
                    value={r.idTypeId ?? ""}
                    onChange={(e) =>
                      upd(
                        idx,
                        "idTypeId",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  >
                    <option value="">— Select —</option>
                    {idTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* id number */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">ID Number</label>
                  <input
                    value={r.idNumber ?? ""}
                    onChange={(e) => upd(idx, "idNumber", e.target.value)}
                    placeholder={
                      r.idTypeId ? `${idTypeMap.get(r.idTypeId) ?? "ID"} number` : "Optional"
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>

                {/* remove row */}
                <div className="sm:col-span-6 flex justify-end">
                  <button
                    onClick={() => delRow(idx)}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs
                               bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100
                               dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-800"
                    title="Remove this row"
                  >
                    <Trash2 size={14} />
                    Remove row
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* foot hint */}
        <div className="text-[11px] text-slate-500">
          Note: Guest gender isn’t captured at booking-guest level in the current schema.
          (Available on Customer profile; we’ll wire if schema adds it.)
        </div>
      </div>
    </div>
  );
}
