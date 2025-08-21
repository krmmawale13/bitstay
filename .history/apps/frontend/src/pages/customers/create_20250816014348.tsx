// apps/frontend/src/pages/customers/create.tsx
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import CustomerForm from "@/components/customers/CustomerForm";
import { createCustomer, type UpsertCustomer } from "@/services/customers.service";
import { useState } from "react";

export default function CreateCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSave(data: UpsertCustomer) {
    setSaving(true);
    try {
      await createCustomer(data);
      router.push("/customers");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-4 max-w-xl">
        <h1 className="text-2xl font-bold">Add Customer</h1>
        <CustomerForm onSubmit={handleSave} submitting={saving} />
      </div>
    </MainLayout>
  );
}
