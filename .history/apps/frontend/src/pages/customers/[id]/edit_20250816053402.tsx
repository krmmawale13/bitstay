// apps/frontend/src/pages/customers/[id]/edit.tsx
import { useRouter } from "next/router";
import CustomerForm from "@/components/customers/CustomerForm";
import MainLayout from "@/layouts/MainLayout";

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id) return null;

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Customer
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Update customer details below and save changes.
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 transition"
            >
              ← Back
            </button>
          </div>

          {/* Card Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <CustomerForm
              customerId={Number(id)}
              onSuccess={() => {
                // redirect or refresh
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
