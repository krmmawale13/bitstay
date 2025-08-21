// src/components/customers/CustomerTable.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getCustomers,
  deleteCustomer,
  type Customer,
} from "@/services/customers.service";
import CustomerForm from "./CustomerForm";
import { useRouter } from "next/router";
import { Eye, Pencil, Trash2, Users, Plus, Search } from "lucide-react";

export default function CustomerTable() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  async function loadCustomers() {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this customer?")) return;
    try {
      setDeletingId(id);
      await deleteCustomer(id);
      await loadCustomers();
    } finally {
      setDeletingId(null);
    }
  }

  function handleEdit(customer: Customer) {
    setSelectedCustomer(customer);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("customer-form-anchor")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function handleCreate() {
    setSelectedCustomer(null);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("customer-form-anchor")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const formatAddress = useMemo(
    () => (c: Customer) => {
      const a = c.addresses?.[0] as any;
      if (!a) return "—";
      const parts: string[] = [];
      if (a.line1) parts.push(a.line1);
      if (a.city) parts.push(a.city);
      if (a.district?.name) parts.push(a.district.name);
      if (a.state?.name) parts.push(a.state.name);
      if (a.pincode) parts.push(a.pincode);
      return parts.join(", ") || "—";
    },
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = `${c.id} ${c.name ?? ""} ${c.email ?? ""} ${c.phone ?? ""} ${formatAddress(c)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [customers, search, formatAddress]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-56 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Customers
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filtered.length} of {customers.length} records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-60 sm:w-72 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pl-9 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <Search
              size={16}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                       bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                       shadow-sm active:scale-[0.98]"
          >
            <Plus size={16} />
            New
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/60 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                <Th>ID</Th>
                <Th>Tenant</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Address</Th>
                <Th className="text-center">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.length > 0 ? (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <Td>#{c.id}</Td>
                    <Td>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                        {c.tenantId ?? "—"}
                      </span>
                    </Td>
                    <Td className="font-medium text-slate-900 dark:text-slate-100">
                      {c.name}
                    </Td>
                    <Td className="text-slate-700 dark:text-slate-300">
                      {c.email || "—"}
                    </Td>
                    <Td className="text-slate-700 dark:text-slate-300">
                      {c.phone || "—"}
                    </Td>
                    <Td className="text-slate-700 dark:text-slate-300 max-w-[28ch] truncate">
                      {formatAddress(c)}
                    </Td>
                    <Td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => router.push(`/customers/${c.id}/customerdashboard`)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-900
                                     bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:ring-slate-700 transition"
                          title="View"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(c)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white
                                     bg-amber-500/90 hover:bg-amber-500 transition shadow-sm"
                          title="Edit"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
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
                ))
              ) : (
                <tr>
                  <Td colSpan={7} className="py-10">
                    <EmptyState onCreate={handleCreate} />
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form */}
      <div id="customer-form-anchor" className="mt-8">
        {showForm && (
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-slate-700 dark:text-slate-200 font-semibold">
                {selectedCustomer ? `Edit #${selectedCustomer.id}` : "Add Customer"}
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <CustomerForm
              customerId={selectedCustomer?.id}
              onSuccess={() => {
                setShowForm(false);
                loadCustomers();
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}
      </div>
    </div>
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
    <th
      className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${className}`}
    >
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

/* ---------- Empty state ---------- */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
        <Users className="text-slate-400" size={22} />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No customers yet</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Create your first customer to get started.
      </p>
      <button
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                   bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                   shadow-sm active:scale-[0.98]"
      >
        <Plus size={16} />
        New Customer
      </button>
    </div>
  );
}
