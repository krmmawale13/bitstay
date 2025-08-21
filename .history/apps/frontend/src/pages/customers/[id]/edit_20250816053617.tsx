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
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                ✏️ Edit Customer
              </h1>
              <p className="text-gray-700 dark:text-gray-300">
                Update customer details below and click <strong>Save</strong>.
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl shadow hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
            >
              ← Back
            </button>
          </div>

          {/* Card Form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-blue-100 dark:border-blue-800">
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
