// apps/frontend/src/components/customers/CustomerForm.tsx
import { useEffect, useState } from "react";
import { type Customer, UpsertCustomer, getCustomerById } from "@/services/customers.service";

interface Props {
  customerId?: number;   // undefined = Add, number = Edit
  onSuccess: () => void;
  onCancel: () => void;
}

type Address0 = {
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export default function CustomerForm({ customerId, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    address0: Address0; // UI fields -> will map to addresses[0]
  }>({
    name: "",
    email: "",
    phone: "",
    address0: { line1: "", line2: "", city: "", state: "", zip: "" },
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    getCustomerById(customerId)
      .then((data: Customer | null) => {
        if (!data) {
          setGlobalError("Customer not found");
          return;
        }
        const first = (data as any)?.addresses?.[0] ?? {};
        setForm({
          name: (data as any)?.name ?? "",
          email: (data as any)?.email ?? "",
          phone: (data as any)?.phone ?? "",
          address0: {
            line1: first.line1 ?? "",
            line2: first.line2 ?? "",
            city: first.city ?? "",
            state: first.state ?? "",
            zip: first.zip ?? "",
          },
        });
      })
      .catch(() => setGlobalError("Failed to load customer details"))
      .finally(() => setLoading(false));
  }, [customerId]);

  const setField = (name: string, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "" }));
    setGlobalError(null);
  };

  const setAddr = (key: keyof Address0, value: string) => {
    setForm((p) => ({ ...p, address0: { ...p.address0, [key]: value } }));
    setErrors((e) => ({ ...e, [`address0.${key}`]: "" }));
    setGlobalError(null);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Invalid email";
    if (form.phone && !/^[0-9+\-\s]{7,20}$/.test(form.phone)) e.phone = "Invalid phone";

    // address line1 not strictly required; if user typed any address field, require line1
    const anyAddr =
      form.address0.line1 || form.address0.line2 || form.address0.city || form.address0.state || form.address0.zip;
    if (anyAddr && !form.address0.line1.trim()) e["address0.line1"] = "Address line 1 is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setGlobalError(null);
    if (!validate()) return;

    const payload: Partial<Customer> & { addresses?: Address0[] } = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      addresses: form.address0.line1.trim()
        ? [
            {
              line1: form.address0.line1.trim(),
              line2: form.address0.line2?.trim() || undefined,
              city: form.address0.city?.trim() || undefined,
              state: form.address0.state?.trim() || undefined,
              zip: form.address0.zip?.trim() || undefined,
            },
          ]
        : [],
    };

    try {
      setSaving(true);
      await UpsertCustomer(customerId ? { id: customerId, ...payload } : payload);
      onSuccess();
      if (!customerId) {
        setForm({
          name: "",
          email: "",
          phone: "",
          address0: { line1: "", line2: "", city: "", state: "", zip: "" },
        });
      }
    } catch (err: unknown) {
      const anyErr = err as any;
      const msg = anyErr?.response?.data?.message || anyErr?.message || "Failed to save customer";
      setGlobalError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-white/80 p-4">Loading…</div>;
  }

  return (
    <div
      className="relative bg-gradient-to-b from-teal-500 to-blue-500 
                 dark:from-gray-900 dark:to-gray-800
                 min-h-screen w-full flex items-center justify-center
                 before:content-[''] before:absolute before:inset-0 before:pointer-events-none
                 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_30%,rgba(255,255,255,0)_60%)]
                 before:opacity-60 before:mix-blend-soft-light"
    >
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-xl rounded-2xl shadow-2xl
                   bg-white/10 backdrop-blur-xl ring-1 ring-white/20 p-6 space-y-4"
      >
        <h2 className="text-2xl font-semibold text-white tracking-tight">
          {customerId ? "Edit Customer" : "Add Customer"}
        </h2>

        {globalError && (
          <div className="text-sm text-red-100 bg-red-500/30 border border-red-400/50 rounded px-3 py-2">
            {globalError}
          </div>
        )}

        {/* Name */}
        <div className="space-y-1">
          <label className="text-sm text-white/90">Name</label>
          <input
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Full name"
            className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400
                        border ${errors.name ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"}
                        focus:outline-none`}
          />
          {errors.name && <p className="text-xs text-red-100">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm text-white/90">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="name@example.com"
            className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400
                        border ${errors.email ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"}
                        focus:outline-none`}
          />
          {errors.email && <p className="text-xs text-red-100">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="text-sm text-white/90">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="e.g. +91 98765 43210"
            className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400
                        border ${errors.phone ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"}
                        focus:outline-none`}
          />
          {errors.phone && <p className="text-xs text-red-100">{errors.phone}</p>}
        </div>

        {/* Address Group -> maps to addresses[0] */}
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 space-y-3">
          <p className="text-sm font-medium text-white/90">Address</p>
          <input
            value={form.address0.line1}
            onChange={(e) => setAddr("line1", e.target.value)}
            placeholder="Line 1"
            className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400
                        border ${errors["address0.line1"] ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"}
                        focus:outline-none`}
          />
          {errors["address0.line1"] && (
            <p className="text-xs text-red-100">{errors["address0.line1"]}</p>
          )}

          <input
            value={form.address0.line2}
            onChange={(e) => setAddr("line2", e.target.value)}
            placeholder="Line 2 (optional)"
            className="w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={form.address0.city}
              onChange={(e) => setAddr("city", e.target.value)}
              placeholder="City"
              className="rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
            <input
              value={form.address0.state}
              onChange={(e) => setAddr("state", e.target.value)}
              placeholder="State"
              className="rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
            <input
              value={form.address0.zip}
              onChange={(e) => setAddr("zip", e.target.value)}
              placeholder="ZIP"
              className="rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex justify-center items-center rounded-lg px-4 py-2
                       bg-white text-gray-900 font-medium hover:bg-gray-100 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center items-center rounded-lg px-4 py-2
                       border border-white/30 text-white hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
