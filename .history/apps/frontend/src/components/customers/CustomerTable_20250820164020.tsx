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
  const [formData, setFormData] = useState<Partial<Customer>>({
    addresses: [{ line1: "", line2: "", city: "", state: "", zip: "" }],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      setLoading(true);
      getCustomerById(customerId)
        .then((data) => {
          if (data) {
            setFormData({
              ...data,
              addresses: data.addresses?.length
                ? data.addresses
                : [{ line1: "", line2: "", city: "", state: "", zip: "" }],
            });
          }
        })
        .catch(() => {
          setError("Failed to load customer details");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSuccess(null);
  };

  const handleAddressChange = (index: number, field: string, value: string) => {
    const updated = [...(formData.addresses || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, addresses: updated }));
  };

  const validateForm = () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      return "Name and Email are required";
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      return "Invalid email format";
    }
    if (formData.phone && !/^[0-9]{7,15}$/.test(formData.phone)) {
      return "Phone must be 7–15 digits";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationMsg = validateForm();
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    try {
      setSaving(true);
      await UpsertCustomer(formData);
      setSuccess("Customer saved successfully ✅");
      setFormData({
        name: "",
        email: "",
        phone: "",
        addresses: [{ line1: "", line2: "", city: "", state: "", zip: "" }],
      });
      onSuccess();
    } catch (err: any) {
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
    <div
      className="relative bg-gradient-to-b from-teal-500 to-blue-500 
           dark:from-gray-900 dark:to-gray-800
           shadow-lg text-white min-h-screen flex items-center justify-center
           before:content-[''] before:absolute before:inset-0 before:pointer-events-none
           before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_30%,rgba(255,255,255,0)_60%)]
           before:opacity-60 before:mix-blend-soft-light"
    >
      <form
        onSubmit={handleSubmit}
        className="relative z-10 space-y-4 p-6 w-full max-w-lg bg-white/20 backdrop-blur-lg shadow-2xl rounded-2xl"
      >
        <h2 className="text-2xl font-bold text-center text-white">
          {customerId ? "Edit Customer" : "Add Customer"}
        </h2>

        {error && <div className="text-red-300 text-sm">{error}</div>}
        {success && <div className="text-green-200 text-sm">{success}</div>}

        <input
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          placeholder="Name"
          className="w-full border rounded px-3 py-2 text-black"
        />
        <input
          name="email"
          type="email"
          value={formData.email || ""}
          onChange={handleChange}
          placeholder="Email"
          className="w-full border rounded px-3 py-2 text-black"
        />
        <input
          name="phone"
          value={formData.phone || ""}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full border rounded px-3 py-2 text-black"
        />

        {/* Addresses */}
        {formData.addresses?.map((addr, index) => (
          <div key={index} className="space-y-2 border p-3 rounded bg-white/40">
            <input
              value={addr.line1 || ""}
              onChange={(e) => handleAddressChange(index, "line1", e.target.value)}
              placeholder="Address Line 1"
              className="w-full border rounded px-3 py-2 text-black"
            />
            <input
              value={addr.line2 || ""}
              onChange={(e) => handleAddressChange(index, "line2", e.target.value)}
              placeholder="Address Line 2"
              className="w-full border rounded px-3 py-2 text-black"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                value={addr.city || ""}
                onChange={(e) => handleAddressChange(index, "city", e.target.value)}
                placeholder="City"
                className="border rounded px-3 py-2 text-black"
              />
              <input
                value={addr.state || ""}
                onChange={(e) => handleAddressChange(index, "state", e.target.value)}
                placeholder="State"
                className="border rounded px-3 py-2 text-black"
              />
              <input
                value={addr.zip || ""}
                onChange={(e) => handleAddressChange(index, "zip", e.target.value)}
                placeholder="ZIP"
                className="border rounded px-3 py-2 text-black"
              />
            </div>
          </div>
        ))}

        <div className="flex gap-2 justify-center">
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
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 text-black"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
