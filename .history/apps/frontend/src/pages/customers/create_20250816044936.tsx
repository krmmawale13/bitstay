import CustomerForm from "@/components/customers/CustomerForm";

export default function CreateCustomerPage() {
  return (
    <div>
      <h1>Create Customer</h1>
      <CustomerForm
        onSuccess={() => {
          // redirect or refresh
        }}
        onCancel={() => {
          // navigate back
        }}
      />
    </div>
  );
}
