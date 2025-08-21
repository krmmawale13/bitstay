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
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                ✏️ Edit Customer
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Make changes to customer details and save them.
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <span className="text-lg">←</span> Back
            </button>
          </div>

          {/* Card Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
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
