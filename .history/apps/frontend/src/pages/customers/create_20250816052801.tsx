import CustomerForm from "@/components/customers/CustomerForm";
import MainLayout from "@/layouts/MainLayout";

export default function CreateCustomerPage() {
  return (
    <MainLayout>
      <h1 className="text-xl font-bold mb-4">Create Customer</h1>
      <CustomerForm
        onSuccess={() => {
          // redirect or refresh
        }}
        onCancel={() => {
          // navigate back
        }}
      />
    </MainLayout>
  );
}
