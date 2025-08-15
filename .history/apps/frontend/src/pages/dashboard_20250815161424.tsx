// src/pages/dashboard.tsx
import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <Topbar />

        {/* Page content */}
        <main className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard title="Total Customers" value="1,245" />
            <DashboardCard title="Active Bookings" value="58" />
            <DashboardCard title="Revenue (This Month)" value="₹ 4,85,000" />
            <DashboardCard title="Pending Payments" value="₹ 82,300" />
          </div>
        </main>
      </div>
    </div>
  );
}

// Reusable dashboard card component
function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-semibold text-gray-900 mt-2">{value}</p>
    </div>
  );
}
