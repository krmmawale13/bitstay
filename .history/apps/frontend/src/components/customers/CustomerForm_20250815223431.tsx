import React, { useEffect, useState } from "react";
import {
  createCustomer,
  updateCustomer,
  getCustomerById,
  Customer,
} from "@/services/customers.service";

export type CustomerFormProps = {
  customerId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const CustomerForm: React.FC<CustomerFormProps> = ({
  customerId,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState<boolean>(!!customerId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!customerId) {
        setLoading(false);
        return;
      }
      try {
        const data: Customer | null = await getCustomerById(customerId);
        if (data) {
          setFormData({
            name: data.name ?? "",
            email: data.email ?? "",
            phone: data.phone ?? "",
            address: data.address ?? "",
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customerId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (customerId) {
        await updateCustomer(customerId, formData);
      } else {
        await createCustomer(formData);
      }
      onSuccess?.();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Customer Name"
            className="border p-2 w-full rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="border p-2 w-full rounded"
            type="email"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Address</label>
          <input
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address"
            className="border p-2 w-full rounded"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
        >
          {saving ? "Saving..." : customerId ? "Update Customer" : "Create Customer"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default CustomerForm;
