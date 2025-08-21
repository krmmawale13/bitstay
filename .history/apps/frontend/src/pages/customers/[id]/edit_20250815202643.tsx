import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import CustomerForm from '@/components/customers/CustomerForm';
import {
  getCustomerById,
  updateCustomer,
  getCustomerMetadata,
} from '@/services/customers.service';

type Customer = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  // keep it lean; addresses/other fields can be added if your schema exposes them
};

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = router.query;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const [cust, meta] = await Promise.all([
          getCustomerById(String(id)),
          // metadata is optional; if endpoint doesn’t exist it’ll gracefully continue
          getCustomerMetadata().catch(() => null),
        ]);
        if (!mounted) return;
        setCustomer(cust);
        setMetadata(meta);
      } catch (e: any) {
        if (!mounted) return;
        setError('Failed to load customer.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleSubmit(values: Partial<Customer>) {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await updateCustomer(String(id), values);
      router.push('/customers');
    } catch (e: any) {
      setError('Failed to update customer.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Edit Customer</h1>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : customer ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <CustomerForm
              initialValues={customer}
              metadata={metadata || undefined}
              submitLabel={saving ? 'Saving...' : 'Save Changes'}
              loading={saving}
              onSubmit={handleSubmit}
            />
          </div>
        ) : (
          <div className="text-gray-500">Customer not found.</div>
        )}
      </div>
    </MainLayout>
  );
}
