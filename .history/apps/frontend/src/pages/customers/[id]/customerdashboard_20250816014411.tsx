// apps/frontend/src/pages/customers/[id]/customerdashboard.tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { getCustomerById, type Customer } from "@/services/customers.service";

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
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Customer Dashboard</h1>
        {!customer ? (
          <div>Loading...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white dark:bg-gray-800 p-4 shadow">
              <h2 className="font-semibold mb-2">Profile</h2>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Name:</span> {customer.name}</div>
                <div><span className="font-medium">Email:</span> {customer.email}</div>
                <div><span className="font-medium">Phone:</span> {customer.phone || "-"}</div>
                <div><span className="font-medium">Address:</span> {customer.address || "-"}</div>
              </div>
            </div>
            {/* future: bookings, invoices, notes, etc. */}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
