import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import { hotelsService, type HotelDTO } from "@/services/property.service";

export default function HotelsIndexPage() {
  const [items, setItems] = useState<HotelDTO[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    hotelsService
      .list()
      .then((data) => {
        if (mounted && Array.isArray(data)) setItems(data);
      })
      .catch((e) => {
        const msg =
          e?.response?.data?.message || e?.message || "Failed to load hotels";
        (window as any).__toast?.push?.({ type: "error", message: msg });
      })
      .finally(() => mounted && setLoading(false));
    return () => void (mounted = false);
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter(
      (h) =>
        h.name.toLowerCase().includes(s) ||
        (h.address || "").toLowerCase().includes(s)
    );
  }, [items, q]);

  return (
    <>
      <Head>
        <title>Hotels | BitStay</title>
      </Head>

      <main className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center rounded-xl p-2 bg-gradient-to-br from-teal-500 to-indigo-600 text-white shadow">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-semibold">Hotels</h1>
          </div>

          <Link
            href="/hotels/create"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-transparent
                       bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Hotel</span>
          </Link>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative w-full max-w-md">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hotels by name or address…"
              className="w-full rounded-xl border border-slate-200 bg-white/70 backdrop-blur px-10 py-2 outline-none
                         focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border bg-white/70 backdrop-blur p-0 shadow-sm overflow-hidden"
        >
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-slate-500 border-b">
            <div className="col-span-5">Name</div>
            <div className="col-span-5">Address</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No hotels found.</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((h) => (
                <li key={h.id} className="px-4 py-3">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <div className="font-medium">{h.name}</div>
                      <div className="text-xs text-slate-500">
                        ID: {h.id} · Created:{" "}
                        {new Date(h.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="col-span-5">
                      <div className="text-sm text-slate-700">
                        {h.address || <span className="text-slate-400">—</span>}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <Link
                        href={`/hotels/${h.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </main>
    </>
  );
}
