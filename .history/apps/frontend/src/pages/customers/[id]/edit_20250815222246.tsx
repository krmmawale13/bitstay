// src/pages/customers/[id]/edit.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import { getCustomerById, updateCustomer, type Customer } from '@/services/customers.service';

export default function CustomerEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState<Partial<Customer>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const data = await getCustomerById(id as string);
      if (data) {
        setForm({
          name: data.name,
          email: data.email,
          phone: data.phone ?? '',
          address: data.address ?? '',
        });
      }
      setLoading(false);
    })();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    await updateCustomer(id as string, form);
    setSaving(false);
    router.push('/customers');
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Edit Customer</h1>

        {loading ? (
          <div>Loading…</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                className="w-full px-3 py-2 rounded-lg border dark:bg-gray-900"
                value={form.name || ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded-lg border dark:bg-gray-900"
                value={form.email || ''}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input
                className="w-full px-3 py-2 rounded-lg border dark:bg-gray-900"
                value={form.phone || ''}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Address (optional)</label>
              <input
                className="w-full px-3 py-2 rounded-lg border dark:bg-gray-900"
                value={form.address || ''}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/customers')}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
