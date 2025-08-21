// apps/frontend/src/components/customers/CustomerForm.tsx
import { useEffect, useState } from "react";
import type { UpsertCustomer, Customer } from "@/services/customers.service";

type Props = {
  initial?: Partial<Customer>;        // edit mode mein aayega
  onSubmit: (data: UpsertCustomer) => Promise<void>;
  submitting?: boolean;
};

export default function CustomerForm({ initial, onSubmit, submitting }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ensure tenantId available
    const t = localStorage.getItem("tenantId");
    if (!t) {
      setError("Tenant not selected. Please login/select tenant again.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const tenantIdStr = localStorage.getItem("tenantId");
    const tenantId = tenantIdStr ? parseInt(tenantIdStr, 10) : NaN;

    if (!tenantId || Number.isNaN(tenantId)) {
      setError("Invalid tenant. Please re-login.");
      return;
    }
    if (!name?.trim()) return setError("Name is required");
    if (!email?.trim()) return setError("Email is required");

    const payload: UpsertCustomer = {
      tenantId,
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      address: address?.trim() || null,
    };

    try {
      await onSubmit(payload);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save customer");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 " +
    "text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-rose-50 text-rose-700 px-4 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input
          className={inputClass}
          placeholder="e.g. Rahul Verma"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input
          type="email"
          className={inputClass}
          placeholder="e.g. rahul@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          className={inputClass}
          placeholder="e.g. 9876543210"
          value={phone ?? ""}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          className={inputClass}
          placeholder="Flat / Street / City"
          value={address ?? ""}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={!!submitting}
          className="px-5 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
