// apps/frontend/src/pages/customers/[id]/edit.tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import CustomerForm from "@/components/customers/CustomerForm";
import { getCustomerById, updateCustomer, type Customer, type UpsertCustomer } from "@/services/customers.service";

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getCustomerById(id as string);
        setCustomer(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleSave(data: UpsertCustomer) {
    if (!id) return;
    setSaving(true);
    try {
      await updateCustomer(id as string, data);
      router.push("/customers");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-4 max-w-xl">
        <h1 className="text-2xl font-bold">Edit Customer</h1>
        {loading ? (
          <div>Loading...</div>
        ) : !customer ? (
          <div>Customer not found.</div>
        ) : (
          <CustomerForm initial={customer} onSubmit={handleSave} submitting={saving} />
        )}
      </div>
    </MainLayout>
  );
}
