// apps/frontend/src/pages/customers/[id]/edit.tsx
import { useRouter } from "next/router";
import { useMemo } from "react";
import CustomerForm from "@/components/customers/CustomerForm";
import MainLayout from "@/layouts/MainLayout";

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = router.query;

  // Wait for router to be ready and coerce id -> number safely
  const customerId = useMemo(() => {
    if (!router.isReady) return undefined;
    const raw = Array.isArray(id) ? id[0] : id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }, [id, router.isReady]);

  if (!router.isReady) return null; // avoid rendering before query is ready
  if (customerId === undefined) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center text-red-600 dark:text-red-300">
          Invalid customer id
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                ✏️ Edit Customer
              </h1>
              <p className="mt-1 text-gray-700 dark:text-gray-400 text-sm">
                Update customer details below and click <strong>Save</strong>.
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow transition-colors duration-200
                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 dark:from-blue-500 dark:to-indigo-500"
            >
              ← Back
            </button>
          </div>

          {/* Card Form */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-blue-100 dark:border-blue-800">
            <CustomerForm
              customerId={customerId}
              onSuccess={() => {
                // After save, go back to list and refresh
                router.replace("/customers");
              }}
              onCancel={() => {
                router.back();
              }}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
