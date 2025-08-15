// apps/frontend/src/pages/dashboard/index.tsx
import React, { useEffect, useState } from "react";
import KpiCard from "@/components/KpiCard";
import { ChartCard } from "@/components/ChartCard";
import { http } from "@/services/http";
import AppLayout from "@/components/AppLayout";


type Summary = {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;       // 0..100
  avgDailyRate: number;
  pendingPayments: number;
  activeGuests: number;
};

export default function DashboardPage() {
  const [sum, setSum] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await http.get<Summary>("/dashboard/summary");
        setSum(data);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load summary");
      }
    })();
  }, []);

  return (
    <AppLayout>
      {err && <div className="mb-4 text-red-600 text-sm">{err}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard label="Total Bookings" value={sum?.totalBookings ?? "—"} />
        <KpiCard label="Total Revenue" value={sum ? `$${sum.totalRevenue.toLocaleString()}` : "—"} />
        <KpiCard label="Occupancy Rate" value={sum ? `${sum.occupancyRate}%` : "—"} />
        <KpiCard label="Avg Daily Rate" value={sum ? `$${sum.avgDailyRate.toFixed(2)}` : "—"} />
        <KpiCard label="Pending Payments" value={sum?.pendingPayments ?? "—"} />
        <KpiCard label="Active Guests" value={sum?.activeGuests ?? "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <ChartCard title="Revenue (last 30 days)" />
        <ChartCard title="Occupancy (last 30 days)" />
      </div>
    </AppLayout>
  );
}
