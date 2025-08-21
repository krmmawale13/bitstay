import { useState, useEffect } from "react";
import {
  Customer,
  UpsertCustomer,
  getCustomerById,
} from "@/services/customers.service";

interface Props {
  customerId?: number; // undefined = Add, number = Edit
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CustomerForm({ customerId, onSuccess, onCancel }: Props) {
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string; // UI ke liye single line; submit par addresses[]
  }>({ name: "", email: "", phone: "", address: "" });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    getCustomerById(customerId)
      .then((data: Customer) => {
        if (!data) return;
        setFormData({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: (data as any).phone ?? "", // ensure optional
          address:
            (Array.isArray((data as any).addresses) &&
              (data as any).addresses[0]?.line1) ||
            "",
        });
      })
      .catch(() => setError("Failed to load customer details"))
      .finally(() => setLoading(false));
  }, [customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setError(null);
  };

  const validate = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      return "Name and Email are required";
    }
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email);
    if (!emailOk) return "Invalid email";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const msg = validate();
    if (msg) return setError(msg);

    // map simple UI -> backend shape
    const payload: Partial<Customer> & {
      addresses?: { line1: string }[];
    } = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone?.trim() || "",
      addresses: formData.address.trim()
        ? [{ line1: formData.address.trim() }]
        : [],
    };

    try {
      setSaving(true);
      // if editing, include id so your Upsert can PUT; else POST
      await UpsertCustomer(customerId ? { id: customerId, ...payload } : payload);
      onSuccess();
      if (!customerId) {
        setFormData({ name: "", email: "", phone: "", address: "" });
      }
    } catch (err: any) {
      const m =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save customer";
      setError(m);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-200">Loading…</div>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      // White card so dark/gradient bg par text clearly dikhe
      className="w-full max-w-md bg-white rounded-2xl shadow-lg p-5 space-y-3"
    >
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm text-gray-700">Name</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Full name"
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-700">Email</label>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="name@example.com"
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-700">Phone</label>
        <input
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="e.g. 9876543210"
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-700">Address</label>
        <input
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Address line 1"
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500">
          (We’ll save this as <code>addresses[0].line1</code>.)
        </p>
      </div>

      <div className="flex gap-2 pt-2">
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
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
