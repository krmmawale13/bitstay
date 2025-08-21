// src/components/customers/CustomerTable.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getCustomers,
  deleteCustomer,
  type Customer,
} from "@/services/customers.service";
import CustomerForm from "./CustomerForm";

export default function CustomerTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    // scroll to form
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="h-10 w-48 rounded bg-slate-200" />
          <div className="h-64 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Customers
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {customers.length} records
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-slate-900 shadow-sm transition
                     bg-gradient-to-r from-teal-300 to-blue-300 hover:from-teal-200 hover:to-blue-200
                     ring-1 ring-black/5 dark:text-slate-900"
        >
          <span className="text-lg leading-none">＋</span>
          New Customer
        </button>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/60 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
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
              {customers.length > 0 ? (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
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
                    <Td className="text-slate-700 dark:text-slate-300">
                      {formatAddress(c)}
                    </Td>
                    <Td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-900
                                     bg-gradient-to-r from-amber-300 to-yellow-300 hover:from-amber-200 hover:to-yellow-200
                                     ring-1 ring-black/5 transition"
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white
                                     bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500
                                     disabled:opacity-60 transition shadow-sm"
                        >
                          {deletingId === c.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <Td colSpan={7} className="py-10 text-center text-slate-500">
                    No customers found.
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
