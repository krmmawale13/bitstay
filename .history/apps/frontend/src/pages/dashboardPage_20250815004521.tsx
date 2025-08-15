import React, { useEffect } from 'react';
import MainLayout from '@/layouts/MainLayout';
import KpiCard from '@/components/KpiCard';
import { ChartCard } from '@/components/ChartCard';
import { useToast } from '@/context/ToastContext';
import { requireAuth } from '@/lib/auth';
import { useRouter } from 'next/router';

export default function DashboardPage() {
  const { add } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!requireAuth()) router.replace('/login');
  }, [router]);

  const summary = {
    bookings_today: 12,
    occupancy_rate: 78,
    revenue_today: 42650,
    new_customers_week: 23,
    low_stock_count: 4,
    pending_invoices: 2
  };

  return (
    <MainLayout>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Bookings Today" value={summary.bookings_today} />
        <KpiCard label="Occupancy %" value={`${summary.occupancy_rate}%`} />
        <KpiCard label="Revenue Today" value={`₹${summary.revenue_today.toLocaleString()}`} />
        <KpiCard label="New Customers (7d)" value={summary.new_customers_week} />
        <KpiCard label="Low Stock Items" value={summary.low_stock_count} />
        <KpiCard label="Pending Invoices" value={summary.pending_invoices} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Occupancy Trend" />
        <ChartCard title="Revenue (Last 14 days)" />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-medium">Recent Bookings</div>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2 pr-6">Booking #</th>
                <th className="py-2 pr-6">Guest</th>
                <th className="py-2 pr-6">Room</th>
                <th className="py-2 pr-6">Check-in</th>
                <th className="py-2 pr-6">Status</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 dark:text-slate-200">
              {[1,2,3,4,5].map(i => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-3 pr-6">BK00{i}</td>
                  <td className="py-3 pr-6">John Doe</td>
                  <td className="py-3 pr-6">Deluxe 204</td>
                  <td className="py-3 pr-6">2025-08-15</td>
                  <td className="py-3 pr-6"><span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs">Checked-in</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => add({ type: 'error', message: 'Create Booking failed • guest_id is required (tbl_bookings.guest_id)' })}
          className="rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 px-4 py-2 text-sm"
        >
          Simulate CRUD Failure Notification
        </button>
      </div>
    </MainLayout>
  );
}
