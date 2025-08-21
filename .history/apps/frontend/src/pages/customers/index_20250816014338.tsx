// apps/frontend/src/pages/customers/index.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import MainLayout from "@/layouts/MainLayout";
import { getCustomers, type Customer, deleteCustomer } from "@/services/customers.service";

export default function CustomersIndexPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getCustomers();
        setRows(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this customer?")) return;
    await deleteCustomer(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Customers</h1>
          <Link
            href="/customers/create"
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
          >
            + Add Customer
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow">
          {loading ? (
            <div className="p-6">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="p-6">No customers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr className="text-left">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3">{c.id}</td>
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3">{c.email}</td>
                      <td className="px-4 py-3">{c.phone || "-"}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <Link
                          href={`/customers/${c.id}/customerdashboard`}
                          className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href={`/customers/${c.id}/edit`}
                          className="px-3 py-1 rounded bg-teal-600 text-white hover:bg-teal-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Delete
                        </button>
                      </td>
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
