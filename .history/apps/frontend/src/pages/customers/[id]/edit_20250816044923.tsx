import { useRouter } from "next/router";
import CustomerForm from "@/components/customers/CustomerForm";

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id) return null;

  return (
    <div>
      <h1>Edit Customer</h1>
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
  );
}
