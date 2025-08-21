// apps/frontend/src/pages/customers/index.tsx
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MainLayout from "@/layouts/MainLayout";
import { getCustomers, type Customer, deleteCustomer } from "@/services/customers.service";
import { Users, Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";

export default function CustomersIndexPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load customers");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this customer?")) return;
    try {
      setDeletingId(id);
      await deleteCustomer(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((c) =>
      `${c.id} ${c.name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(s)
    );
  }, [rows, q]);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Users size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Customers
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filtered.length} of {rows.length} records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, phone…"
                className="w-60 sm:w-72 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pl-9 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <Link
              href="/customers/create"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                         shadow-sm active:scale-[0.98]"
            >
              <Plus size={16} />
              New
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
            <div className="font-semibold">Couldn’t load customers</div>
            <div className="opacity-80">{error}</div>
            <button
              onClick={load}
              className="mt-2 inline-flex items-center rounded px-3 py-1 text-white bg-rose-600 hover:bg-rose-500"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table Card */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-10 w-56 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-64 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">No customers found.</div>
          ) : (
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  <tr className="text-left">
                    <Th>ID</Th>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th className="text-center">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <Td>#{c.id}</Td>
                      <Td className="font-medium text-slate-900 dark:text-slate-100">{c.name}</Td>
                      <Td className="text-slate-700 dark:text-slate-300">{c.email || "—"}</Td>
                      <Td className="text-slate-700 dark:text-slate-300">{c.phone || "—"}</Td>
                      <Td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/customers/${c.id}/customerdashboard`}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-900
                                       bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:ring-slate-700 transition"
                            title="View"
                          >
                            <Eye size={16} />
                            View
                          </Link>
                          <Link
                            href={`/customers/${c.id}/edit`}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white
                                       bg-amber-500/90 hover:bg-amber-500 transition shadow-sm"
                            title="Edit"
                          >
                            <Pencil size={16} />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white
                                       bg-rose-600 hover:bg-rose-500 disabled:opacity-60 transition shadow-sm"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                            {deletingId === c.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

/* ---------- tiny cells ---------- */
function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={`whitespace-nowrap px-4 py-3 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
