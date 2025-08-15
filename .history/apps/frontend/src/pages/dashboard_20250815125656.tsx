// apps/frontend/src/pages/dashboardPage.tsx

import { useEffect, useState } from "react";
import { api } from "@/services/http"; // ✅ using api instead of http

interface Summary {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const { data } = await api.get<Summary>("/dashboard/summary");
        setSummary(data);
      } catch (error) {
        console.error("Error fetching dashboard summary:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (!summary) {
    return <p>No dashboard data available.</p>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <ul>
        <li>Total Bookings: {summary.totalBookings}</li>
        <li>Total Revenue: ₹{summary.totalRevenue}</li>
        <li>Occupancy Rate: {summary.occupancyRate}%</li>
      </ul>
    </div>
  );
}
