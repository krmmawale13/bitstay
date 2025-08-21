// src/pages/customers/new.tsx
import CustomerForm from "@/components/customers/CustomerForm";
import MainLayout from "@/layouts/MainLayout";

export default function NewCustomerPage() {
  return (
    <MainLayout title="Create Customer">
      <h1 className="text-2xl font-bold mb-4">Create Customer</h1>
      <CustomerForm />
    </MainLayout>
  );
}
