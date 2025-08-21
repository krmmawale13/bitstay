import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '@/layouts/MainLayout';
import { getCustomerById } from '@/services/customers.service';

type Customer = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
};

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { id } = router.query;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getCustomerById(String(id));
        if (!mounted) return;
        setCustomer(data);
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

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Customer Dashboard</h1>
          {id ? (
            <div className="flex gap-3">
              <Link
                href={`/customers/${id}/edit`}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
              >
                Edit
              </Link>
              <Link
                href="/customers"
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Back to List
              </Link>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : !customer ? (
          <div className="text-gray-500">Customer not found.</div>
        ) : (
          <>
            {/* Summary card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{customer.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    #{customer.id}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 p-4">
                    <div className="text-xs uppercase text-gray-500">Email</div>
                    <div className="mt-1 font-medium">{customer.email}</div>
                  </div>
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-4">
                    <div className="text-xs uppercase text-gray-500">Phone</div>
                    <div className="mt-1 font-medium">{customer.phone ?? '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder stats (wire to bookings/payments when APIs are ready) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl shadow p-5 bg-white dark:bg-gray-800">
                <div className="text-sm text-gray-500">Total Bookings</div>
                <div className="mt-2 text-2xl font-semibold">—</div>
              </div>
              <div className="rounded-xl shadow p-5 bg-white dark:bg-gray-800">
                <div className="text-sm text-gray-500">Lifetime Value</div>
                <div className="mt-2 text-2xl font-semibold">—</div>
              </div>
              <div className="rounded-xl shadow p-5 bg-white dark:bg-gray-800">
                <div className="text-sm text-gray-500">Last Activity</div>
                <div className="mt-2 text-2xl font-semibold">—</div>
              </div>
            </div>

            {/* Activity / notes / future related tables can go here */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Activity</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Hook this up to bookings/payments APIs later.
              </p>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
