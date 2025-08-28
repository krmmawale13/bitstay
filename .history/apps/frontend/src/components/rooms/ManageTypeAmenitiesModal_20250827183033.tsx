import { useEffect, useState } from "react";
import { roomsService, type AmenityDTO } from "@/services/property.service";
import { motion } from "framer-motion";
import { X, Check, Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allAmenities, setAllAmenities] = useState<AmenityDTO[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // load all amenities (from meta) + current type selection
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const meta = await roomsService.meta(); // has amenities list
        const type = await roomsService.getTypeAmenities(typeId); // { amenityIds, amenities }
        if (!mounted) return;

        setAllAmenities(Array.isArray(meta?.amenities) ? meta.amenities : []);
        setSelectedIds(Array.isArray(type?.amenityIds) ? type.amenityIds : []);
      } catch (e: any) {
        toast("error", "Failed to load amenities", e?.message);
        setAllAmenities([]);
        setSelectedIds([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, typeId]);

  const toggle = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function onSave() {
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

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="font-semibold">Manage Room Type Amenities</div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={16} />
            Loading…
          </div>
        ) : (
          <>
            {allAmenities.length === 0 ? (
              <div className="mt-3 text-sm text-slate-500">
                No amenities defined yet. Add amenities in reference data.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-auto pr-1">
                {allAmenities.map((a) => {
                  const active = selectedIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggle(a.id)}
                      className={cls(
                        "w-full text-left px-3 py-2 rounded-xl ring-1 transition",
                        active
                          ? "ring-emerald-300 bg-emerald-50 text-emerald-700 dark:ring-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : "ring-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      )}
                      title={a.name}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{a.name}</span>
                        {active && <Check size={16} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="rounded-xl px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
