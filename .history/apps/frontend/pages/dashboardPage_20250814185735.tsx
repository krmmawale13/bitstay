// pages/dashboardPage.tsx
import MainLayout from "../layouts/MainLayout";

export default function DashboardPage() {
  return (
    <MainLayout>
      <h1 className="text-2xl font-bold text-[#007B83] mb-4">Welcome to BitStay</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-4 bg-white rounded-xl shadow">Card 1</div>
        <div className="p-4 bg-white rounded-xl shadow">Card 2</div>
        <div className="p-4 bg-white rounded-xl shadow">Card 3</div>
      </div>
    </MainLayout>
  );
}
