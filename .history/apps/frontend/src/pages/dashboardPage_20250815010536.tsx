import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

// Local KPI Card component
type KpiCardProps = {
  title: string;
  value: string | number;
  unit?: string;
};

function KpiCard({ title, value, unit }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 flex flex-col">
      <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
      <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {value} {unit && <span className="text-sm">{unit}</span>}
      </span>
    </div>
  );
}

type DashboardSummary = {
  totalBookings: number;
  totalCustomers: number;
  totalRevenue: number;
  occupancyRate: number;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get<DashboardSummary>(
          "http://localhost:3000/api/v1/dashboard/summary"
        );
        setSummary(data);
      } catch (error) {
        console.error("Error fetching dashboard summary:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {!summary ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Total Bookings" value={summary.totalBookings} />
            <KpiCard title="Total Customers" value={summary.totalCustomers} />
            <KpiCard
              title="Total Revenue"
              value={summary.totalRevenue.toLocaleString()}
              unit="₹"
            />
            <KpiCard
              title="Occupancy Rate"
              value={summary.occupancyRate}
              unit="%"
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
