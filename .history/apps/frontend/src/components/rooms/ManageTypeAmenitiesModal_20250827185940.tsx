import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save, Check } from "lucide-react";
import { roomsService, type AmenityDTO } from "@/services/property.service";

/* toast */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type Props = {
  open: boolean;
  typeId: number;
  onClose: () => void;
  onSaved?: () => void;
};

export default function ManageTypeAmenitiesModal({ open, typeId, onClose, onSaved }: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allAmenities, setAllAmenities] = useState<AmenityDTO[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => setMounted(true), []);

  // load meta amenities + selected for this type
  useEffect(() => {
    if (!open) return;
    let live = true;
    (async () => {
      try {
        setLoading(true);
        const meta = await roomsService.meta();
        const all = Array.isArray(meta?.amenities) ? meta.amenities : [];
        const res = await roomsService.getTypeAmenities(typeId);
        const picked = Array.isArray(res?.amenityIds) ? res.amenityIds : [];
        if (!live) return;
        setAllAmenities(all);
        setSelectedIds(picked);
      } catch (e: any) {
        toast("error", "Failed to load amenities", e?.message);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [open, typeId]);

  function toggle(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save() {
    try {
      setSaving(true);
      await roomsService.setTypeAmenities(typeId, selectedIds);
      toast("success", "Amenities saved");
      onSaved?.();
      onClose();
    } catch (e: any) {
      toast("error", "Save failed", e?.message);
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="dialog"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="absolute inset-x-0 top-16 mx-auto w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="font-semibold">Manage Room Type Amenities</div>
              <button
                onClick={onClose}
                className="rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="animate-spin" size={16} /> Loading…
                </div>
              ) : allAmenities.length === 0 ? (
                <div className="text-sm text-slate-500">No amenities defined yet. Add amenities in master data.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {allAmenities.map((a) => {
                    const active = selectedIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggle(a.id)}
                        className={cls(
                          "flex items-center justify-between rounded-xl px-3 py-2 text-sm ring-1 transition",
                          active
                            ? "ring-emerald-300 bg-emerald-50 text-emerald-700 dark:ring-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                            : "ring-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        )}
                      >
                        <span className="truncate">{a.name}</span>
                        {active && <Check size={16} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={onClose}
                className="rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
