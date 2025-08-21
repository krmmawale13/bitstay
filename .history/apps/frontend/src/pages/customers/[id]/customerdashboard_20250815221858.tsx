// src/pages/customers/[id]/customerdashboard.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import Link from 'next/link';
import { getCustomerById, type Customer } from '@/services/customers.service';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { id } = router.query;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const data = await getCustomerById(id as string);
      setCustomer(data);
      setLoading(false);
    })();
  }, [id]);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Customer Dashboard</h1>
          {id && (
            <Link
              href={`/customers/${id}/edit`}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
            >
              Edit Customer
            </Link>
          )}
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : !customer ? (
          <div>No customer found.</div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                <div className="text-sm text-gray-500">Name</div>
                <div className="text-xl font-semibold">{customer.name}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                <div className="text-sm text-gray-500">Email</div>
                <div className="text-xl font-semibold">{customer.email}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                <div className="text-sm text-gray-500">Phone</div>
                <div className="text-xl font-semibold">{customer.phone || '-'}</div>
              </div>
            </div>

            {/* Placeholder for charts / related records */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-2">Activity</h2>
              <p className="text-sm text-gray-500">
                Hook up bookings/payments charts here once endpoints are ready.
              </p>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
