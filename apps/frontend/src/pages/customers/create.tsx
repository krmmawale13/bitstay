import CustomerForm from "@/components/customers/CustomerForm";
import MainLayout from "@/layouts/MainLayout";
import { useRouter } from "next/router";

export default function CreateCustomerPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Create Customer</h1>
          <button
            onClick={() => router.push("/customers")}
            className="text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg"
          >
            ← Back
          </button>
        </div>

        {/* Form */}
        <CustomerForm
          onSuccess={() => {
            router.push("/customers"); // redirect to customers list
          }}
          onCancel={() => {
            router.push("/customers"); // navigate back
          }}
        />
      </div>
    </MainLayout>
  );
}
