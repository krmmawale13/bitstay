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
      <div className="p-6 max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Edit Customer
          </h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
          >
            Back
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6">
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
    </MainLayout>
  );
}
