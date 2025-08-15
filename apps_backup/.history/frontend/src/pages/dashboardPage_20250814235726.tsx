import MainLayout from "@/layouts/MainLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const data = [
  { name: "Bookings", value: 24 },
  { name: "Customers", value: 18 },
  { name: "Sales", value: 35 },
];

export default function DashboardPage() {
  return (
    <MainLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="font-semibold mb-4">Module Summary</h2>
          <BarChart width={400} height={250} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#1E90A1" />
          </BarChart>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="font-semibold">Recent Activity</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Booking #123 created</li>
            <li>Customer John added</li>
            <li>Stock updated for Vodka</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
