// apps/frontend/src/components/customers/CustomerForm.tsx
import React, { useEffect, useState } from 'react';
import { createCustomer, updateCustomer, getCustomerById, type Customer } from '@/services/customers.service';

type Props = {
  customerId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function CustomerForm({ customerId, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!customerId);

  useEffect(() => {
    (async () => {
      if (!customerId) { setLoading(false); return; }
      const data = await getCustomerById(customerId);
      if (data) setForm(data);
      setLoading(false);
    })();
  }, [customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tenantId = Number(localStorage.getItem('tenantId') || ''); // auto inject
      const payload = { ...form, tenantId };

      if (customerId) {
        await updateCustomer(customerId, payload);
      } else {
        await createCustomer(payload);
      }
      onSuccess?.();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            name="name"
            value={form.name ?? ''}
            onChange={handleChange}
            placeholder="Customer Name"
            className="border p-2 w-full rounded text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            name="email"
            value={form.email ?? ''}
            onChange={handleChange}
            placeholder="Email"
            type="email"
            className="border p-2 w-full rounded text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input
            name="phone"
            value={form.phone ?? ''}
            onChange={handleChange}
            placeholder="Phone"
            className="border p-2 w-full rounded text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Address</label>
          <input
            name="address"
            value={form.address ?? ''}
            onChange={handleChange}
            placeholder="Address"
            className="border p-2 w-full rounded text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-900"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
        >
          {saving ? 'Saving...' : customerId ? 'Update Customer' : 'Create Customer'}
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
}
