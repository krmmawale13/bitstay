// apps/frontend/src/components/customers/CustomerForm.tsx
import { useEffect, useMemo, useState } from "react";
import { type Customer, UpsertCustomer, getCustomerById } from "@/services/customers.service";
// Create this lightweight service if you don't have it yet
// export type StateDTO = { id: number; code: string; name: string };
// export async function listStates(): Promise<StateDTO[]> { return fetch("/api/states").then(r => r.json()); }
import { type StateDTO, listStates } from "@/services/locations.service";

/**
 * Schema sync assumptions (Bhai Ka CRM):
 * - Address.state is a RELATION to State (unique `code`) and optional (nullable) is allowed.
 * - We send addresses[].stateCode (e.g., "MH"), backend maps to state via connect/connectOrCreate.
 * - Customer belongs to current tenant from context; tenantId not shown in form.
 */

interface Props {
  customerId?: number; // undefined = Add, number = Edit
  onSuccess: () => void;
  onCancel: () => void;
}

// UI address block
export type AddressUI = {
  line1: string;
  line2?: string;
  city?: string;
  stateCode?: string; // "MH", "GJ", etc
  zip?: string;
};

// API address when loading existing customer
// state may be legacy string or object { code, name }
export type ApiAddress = {
  id?: number;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  zip?: string | null;
  state?: string | { code?: string | null; name?: string | null } | null;
};

export default function CustomerForm({ customerId, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    addresses: AddressUI[]; // supports multiple addresses
  }>({
    name: "",
    email: "",
    phone: "",
    addresses: [emptyAddress()],
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // States dropdown options
  const [states, setStates] = useState<StateDTO[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const stateOptions = useMemo(() => states.map(s => ({ value: s.code, label: `${s.code} — ${s.name}` })), [states]);

  // Load States (once)
  useEffect(() => {
    setLoadingStates(true);
    listStates()
      .then((rows) => setStates(rows || []))
      .catch(() => setStates([]))
      .finally(() => setLoadingStates(false));
  }, []);

  // Load existing customer
  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    getCustomerById(customerId)
      .then((data: Customer | null) => {
        if (!data) {
          setGlobalError("Customer not found");
          return;
        }
        const apiAddresses: ApiAddress[] = ((data as any)?.addresses ?? []) as ApiAddress[];
        const uiAddresses: AddressUI[] = (apiAddresses.length ? apiAddresses : [{} as ApiAddress]).map((a) => ({
          line1: a.line1 ?? "",
          line2: a.line2 ?? "",
          city: a.city ?? "",
          zip: a.zip ?? "",
          stateCode: typeof a.state === "object" && a.state ? (a.state.code ?? "") || "" : "",
        }));

        setForm({
          name: (data as any)?.name ?? "",
          email: (data as any)?.email ?? "",
          phone: (data as any)?.phone ?? "",
          addresses: uiAddresses.length ? uiAddresses : [emptyAddress()],
        });
      })
      .catch(() => setGlobalError("Failed to load customer details"))
      .finally(() => setLoading(false));
  }, [customerId]);

  // Handlers
  const setField = (name: "name" | "email" | "phone", value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "" }));
    setGlobalError(null);
  };

  const setAddr = (i: number, key: keyof AddressUI, value: string) => {
    setForm((p) => ({
      ...p,
      addresses: p.addresses.map((a, idx) => (idx === i ? { ...a, [key]: value } : a)),
    }));
    setErrors((e) => ({ ...e, [`addresses.${i}.${String(key)}`]: "" }));
    setGlobalError(null);
  };

  const addAddress = () => setForm((p) => ({ ...p, addresses: [...p.addresses, emptyAddress()] }));
  const removeAddress = (i: number) => setForm((p) => ({ ...p, addresses: p.addresses.filter((_, idx) => idx !== i) }));

  // Validation
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Invalid email";
    if (form.phone && !/^[0-9+\-\s]{7,20}$/.test(form.phone)) e.phone = "Invalid phone";

    form.addresses.forEach((a, i) => {
      const anyAddr = a.line1 || a.line2 || a.city || a.zip || a.stateCode;
      if (anyAddr && !String(a.line1).trim()) e[`addresses.${i}.line1`] = "Address line 1 is required";
      if (a.stateCode && !/^([A-Z]{2,3})$/.test(String(a.stateCode).trim().toUpperCase()))
        e[`addresses.${i}.stateCode`] = "Use state code (e.g., MH)";
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Submit
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setGlobalError(null);
    if (!validate()) return;

    const addressesPayload = form.addresses
      .map((a) => ({
        line1: a.line1?.trim(),
        line2: a.line2?.trim() || undefined,
        city: a.city?.trim() || undefined,
        zip: a.zip?.trim() || undefined,
        stateCode: a.stateCode?.trim() ? a.stateCode.trim().toUpperCase() : undefined,
      }))
      // drop completely empty blocks
      .filter((a) => a.line1);

    const payload: Partial<Customer> & { addresses?: Array<{ line1: string; line2?: string; city?: string; zip?: string; stateCode?: string }> } = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      addresses: addressesPayload,
    };

    try {
      setSaving(true);
      await UpsertCustomer(customerId ? { id: customerId, ...payload } : payload);
      onSuccess();
      if (!customerId) {
        setForm({ name: "", email: "", phone: "", addresses: [emptyAddress()] });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save customer";
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
        className="relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl
                   bg-white/10 backdrop-blur-xl ring-1 ring-white/20 p-6 space-y-6"
      >
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            {customerId ? "Edit Customer" : "Add Customer"}
          </h2>
          <div className="text-xs text-white/70">
            {loadingStates ? "Loading states…" : `${stateOptions.length} states loaded`}
          </div>
        </header>

        {globalError && (
          <div className="text-sm text-red-100 bg-red-500/30 border border-red-400/50 rounded px-3 py-2">
            {globalError}
          </div>
        )}

        {/* Basic Fields */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="name" className="text-sm text-white/90">Name</label>
            <input
              id="name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Full name"
              autoComplete="name"
              className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border ${errors.name ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"} focus:outline-none`}
            />
            {errors.name && <p className="text-xs text-red-100">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm text-white/90">Phone</label>
            <input
              id="phone"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="e.g. +91 98765 43210"
              autoComplete="tel"
              inputMode="tel"
              className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border ${errors.phone ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"} focus:outline-none`}
            />
            {errors.phone && <p className="text-xs text-red-100">{errors.phone}</p>}
          </div>

          <div className="space-y-1 md:col-span-3">
            <label htmlFor="email" className="text-sm text-white/90">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border ${errors.email ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"} focus:outline-none`}
            />
            {errors.email && <p className="text-xs text-red-100">{errors.email}</p>}
          </div>
        </section>

        {/* Addresses */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/90">Addresses</p>
            <button
              type="button"
              onClick={addAddress}
              className="text-xs px-3 py-1 rounded-lg border border-white/30 text-white hover:bg-white/10"
            >
              + Add address
            </button>
          </div>

          {form.addresses.map((addr, i) => (
            <div key={i} className="rounded-xl border border-white/20 bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white/80 text-sm">Address #{i + 1}</p>
                {form.addresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAddress(i)}
                    className="text-xs px-2 py-1 rounded border border-red-300/60 text-red-100 hover:bg-red-500/20"
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                value={addr.line1}
                onChange={(e) => setAddr(i, "line1", e.target.value)}
                placeholder="Line 1"
                className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border ${errors[`addresses.${i}.line1`] ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"} focus:outline-none`}
              />
              {errors[`addresses.${i}.line1`] && (
                <p className="text-xs text-red-100">{errors[`addresses.${i}.line1`]}</p>
              )}

              <input
                value={addr.line2}
                onChange={(e) => setAddr(i, "line2", e.target.value)}
                placeholder="Line 2 (optional)"
                className="w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={addr.city}
                  onChange={(e) => setAddr(i, "city", e.target.value)}
                  placeholder="City"
                  className="rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                />

                {/* State dropdown */}
                <select
                  value={addr.stateCode || ""}
                  onChange={(e) => setAddr(i, "stateCode", e.target.value)}
                  className={`rounded-lg px-3 py-2 bg-white text-gray-900 border ${errors[`addresses.${i}.stateCode`] ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"} focus:outline-none`}
                  disabled={loadingStates}
                >
                  <option value="">-- Select State --</option>
                  {stateOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <input
                  value={addr.zip}
                  onChange={(e) => setAddr(i, "zip", e.target.value)}
                  placeholder="ZIP"
                  className="rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                />
              </div>
              {errors[`addresses.${i}.stateCode`] && (
                <p className="text-xs text-red-100">{errors[`addresses.${i}.stateCode`]}</p>
              )}
            </div>
          ))}
        </section>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex justify-center items-center rounded-lg px-4 py-2 bg-white text-gray-900 font-medium hover:bg-gray-100 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center items-center rounded-lg px-4 py-2 border border-white/30 text-white hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function emptyAddress(): AddressUI {
  return { line1: "", line2: "", city: "", stateCode: "", zip: "" };
}
