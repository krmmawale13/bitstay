// apps/frontend/src/pages/customers/[id]/customerdashboard.tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { getCustomerById, type Customer } from "@/services/customers.service";
import { ArrowLeft } from "lucide-react";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { id } = router.query;
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const c = await getCustomerById(id as string);
      setCustomer(c);
    })();
  }, [id]);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/customers")}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h1 className="text-2xl font-bold">Customer Dashboard</h1>
          </div>
        </div>

        {/* Content */}
        {!customer ? (
          <div className="text-gray-500 italic">Loading customer details...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Card */}
            <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-lg mb-4">Profile Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Name</span>
                  <span>{customer.name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Email</span>
                  <span>{customer.email}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Phone</span>
                  <span>{customer.phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Address</span>
                  <span>{customer.address || "-"}</span>
                </div>
              </div>
            </div>

            {/* Placeholder for future sections */}
            <div className="round
