// src/components/customers/CustomerTable.tsx
import { useEffect, useState } from "react";
import { getCustomers, deleteCustomer } from "@/services/customers.service";
import { Customer } from "@/services/customers.service";
import CustomerForm from "./CustomerForm";

export default function CustomerTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadCustomers() {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this customer?")) {
      await deleteCustomer(id);
      loadCustomers();
    }
  }

  function handleEdit(customer: Customer) {
    setSelectedCustomer(customer);
    setShowForm(true);
  }

  function handleCreate() {
    setSelectedCustomer(null);
    setShowForm(true);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  if (loading) {
    return <p className="text-center py-6">Loading customers...</p>;
  }

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Customers</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
        >
          + New Customer
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Tenant</th>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">Address</th>
              <th className="border px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{c.id}</td>
                  <td className="border px-4 py-2">{c.tenantId}</td>
                  <td className="border px-4 py-2">{c.name}</td>
                  <td className="border px-4 py-2">{c.email}</td>
                  <td className="border px-4 py-2">{c.phone}</td>
                  <td className="border px-4 py-2">{c.address}</td>
                  <td className="border px-4 py-2 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(c)}
                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mt-6 border-t pt-4">
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
  );
}
