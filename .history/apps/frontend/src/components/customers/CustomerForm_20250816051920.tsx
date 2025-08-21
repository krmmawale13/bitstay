import { useState, useEffect } from "react";
import {
  Customer,
  UpsertCustomer,
  getCustomerById,
} from "@/services/customers.service";

interface Props {
  customerId?: number; // null = Add mode, number = Edit mode
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CustomerForm({ customerId, onSuccess, onCancel }: Props) {
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      setLoading(true);
      getCustomerById(customerId)
        .then((data) => {
          if (data) setFormData(data);
        })
        .catch(() => {
          setError("Failed to load customer details");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setFormData({});
    }
  }, [customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name || !formData.email) {
      setError("Name and Email are required");
      return;
    }

    try {
      setSaving(true);
      await UpsertCustomer(formData);
      setSuccess("Customer saved successfully ✅");
      setFormData({}); // reset form
      onSuccess();
    } catch (err: any) {
      // Check if backend sent duplicate email error
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save customer";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Loading customer data...</div>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 p-4 bg-white shadow rounded-lg"
    >
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}

      <input
        name="name"
        value={formData.name || ""}
        onChange={handleChange}
        placeholder="Name"
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        name="email"
        type="email"
        value={formData.email || ""}
        onChange={handleChange}
        placeholder="Email"
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        name="phone"
        value={formData.phone || ""}
        onChange={handleChange}
        placeholder="Phone"
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        name="address"
        value={formData.address || ""}
        onChange={handleChange}
        placeholder="Address"
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
