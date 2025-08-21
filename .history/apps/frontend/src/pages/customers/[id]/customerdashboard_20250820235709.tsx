// apps/frontend/src/pages/customers/[id]/customerdashboard.tsx
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import MainLayout from "@/layouts/MainLayout";
import { getCustomerById, type Customer } from "@/services/customers.service";
import { ArrowLeft } from "lucide-react";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { id } = router.query;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  // safe parse id
  const customerId = useMemo(() => {
    if (!router.isReady) return undefined;
    const raw = Array.isArray(id) ? id[0] : id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }, [id, router.isReady]);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    (async () => {
      try {
        const c = await getCustomerById(customerId);
        setCustomer(c);
      } catch (err) {
        console.error("Failed to load customer", err);
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  // resolve address for display
  const primaryAddress = useMemo(() => {
    if (!customer?.addresses?.length) return null;
    const a = customer.addresses[0];
    const stateName =
      typeof (a as any)?.state === "object"
        ? (a as any).state?.name ?? (a as any).state?.code
        : undefined;
    return [a.line1, a.line2, a.city, stateName, a.zip]
      .filter((x) => x && String(x).trim())
      .join(", ");
  }, [customer]);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/customers")}
              className="flex items-center gap-1 px-3 py-1.5 
                         bg-gray-200 hover:bg-gray-300 
                         dark:bg-gray-700 dark:hover:bg-gray-600 
                         rounded-lg text-sm transition"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h1 className="text-2xl font-bold">Customer Dashboard</h1>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-gray-500 italic">Loading customer details...</div>
        ) : !customer ? (
          <div className="text-red-500 italic">Customer not found</div>
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
                  <span>{primaryAddress || "-"}</span>
                </div>
              </div>
            </div>

            {/* Placeholder for future sections */}
            <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-lg mb-4">Upcoming Features</h2>
              <p className="text-sm text-gray-500">
                Bookings, invoices, and notes will appear here soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
