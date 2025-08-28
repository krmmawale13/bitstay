import { useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import { hotelsService } from "@/services/property.service";
import { ArrowLeft, Building2, Save } from "lucide-react";

/* toast */
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push ? api.push({ type, message, description }) : console.log(`[toast:${type}]`, message, description ?? "");
}

export default function HotelCreatePage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  async function onSave() {
    if (!name.trim()) {
      toast("error", "Name required");
      return;
    }
    try {
      setBusy(true);
      const h = await hotelsService.create({ name: name.trim(), address: address.trim() || undefined });
      toast("success", "Hotel created");
      router.replace(`/hotels/${h.id}`);
    } catch (e: any) {
      toast("error", "Create failed", e?.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/hotels")}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-sm">
                <Building2 size={18} />
              </div>
              <div className="text-2xl font-bold">New Hotel</div>
            </div>
          </div>

          <button
            onClick={onSave}
            disabled={busy || !name.trim()}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
          >
            <Save size={16} />
            Save
          </button>
        </div>

        {/* Form card */}
        <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
