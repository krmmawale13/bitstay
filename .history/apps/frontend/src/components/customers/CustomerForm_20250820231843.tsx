// apps/frontend/src/components/customers/CustomerForm.tsx
import { useEffect, useState } from "react";
import { type Customer, UpsertCustomer, getCustomerById } from "@/services/customers.service";

/**
 * CLEAN SYNC with backend (CustomersController/Service):
 * - States endpoint: GET /api/customers/states  (remove /api if you don't use a global prefix)
 * - Backend prefers addresses[].stateId, fallback addresses[].stateCode
 * - This form loads states, shows a dropdown, and on submit sends BOTH (id + code when available)
 */

interface Props {
  customerId?: number; // undefined = Add, number = Edit
  onSuccess: () => void;
  onCancel: () => void;
}

// UI address shape (single address block in the form)
type Address0 = {
  line1: string;
  line2?: string;
  city?: string;
  stateSel?: string; // value in <select>: either state.code OR String(state.id) (fallback)
  zip?: string;
};

// API address (when loading existing customer)
type ApiAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  zip?: string | null;
  state?: {
    id?: number | null;
    code?: string | null;
    name?: string | null;
  } | string | null;
};

// State row from backend dropdown
type StateDTO = {
  id: number;
  code?: string;
  name?: string;
  label?: string;
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
    address0: { line1: "", line2: "", city: "", stateSel: "", zip: "" },
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // States dropdown
  const [states, setStates] = useState<StateDTO[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  // Load states once
  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
    const endpoint = `${API_BASE}/api/customers/states`; // if no global 'api' prefix, change to '/customers/states'
    setLoadingStates(true);
    fetch(endpoint, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        const data = (await r.json()) as unknown;
        if (!Array.isArray(data)) return [];
        return (data as any[]).map((row) => ({
          id: Number(row?.id),
          code: typeof row?.code === "string" ? row.code : undefined,
          name: typeof row?.name === "string" ? row.name : undefined,
          label:
            typeof row?.label === "string"
              ? row.label
              : `${row?.code ?? ""} ${row?.name ?? ""}`.trim(),
        })) as StateDTO[];
      })
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
        const first = ((data as any)?.addresses?.[0] ?? {}) as ApiAddress;

        // resolve select value: prefer state.code; else fallback to String(state.id); else empty
        let stateSel = "";
        if (typeof first.state === "string") {
          // legacy string like "Maharashtra" → cannot map reliably, keep empty to force user selection
          stateSel = "";
        } else if (first.state && typeof first.state === "object") {
          const code = (first.state.code ?? "").toString().trim();
          const id = typeof first.state.id === "number" ? String(first.state.id) : "";
          stateSel = code || id || "";
        }

        setForm({
          name: (data as any)?.name ?? "",
          email: (data as any)?.email ?? "",
          phone: (data as any)?.phone ?? "",
          address0: {
            line1: first.line1 ?? "",
            line2: first.line2 ?? "",
            city: first.city ?? "",
            stateSel,
            zip: first.zip ?? "",
          },
        });
      })
      .catch(() => setGlobalError("Failed to load customer details"))
      .finally(() => setLoading(false));
  }, [customerId]);

  const setField = (name: "name" | "email" | "phone", value: string) => {
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

    // If any address field is typed, require line1
    const anyAddr =
      form.address0.line1 ||
      form.address0.line2 ||
      form.address0.city ||
      form.address0.stateSel ||
      form.address0.zip;
    if (anyAddr && !form.address0.line1.trim()) e["address0.line1"] = "Address line 1 is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setGlobalError(null);
    if (!validate()) return;

    // Find selected state by code or id-string
    const sel = form.address0.stateSel?.trim() ?? "";
    const selectedState = states.find(
      (s) => s.code === sel || String(s.id) === sel
    );

    const addresses =
      form.address0.line1.trim()
        ? [
            {
              line1: form.address0.line1.trim(),
              line2: form.address0.line2?.trim() || undefined,
              city: form.address0.city?.trim() || undefined,
              zip: form.address0.zip?.trim() || undefined,
              // Backend prefers stateId, fallback stateCode
              stateId: selectedState?.id,
              stateCode: selectedState?.code, // only if backend has unique code column
            },
          ]
        : [];

    const payload: Partial<Customer> & {
      addresses?: Array<{
        line1: string;
        line2?: string;
        city?: string;
        zip?: string;
        stateId?: number;
        stateCode?: string;
      }>;
    } = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      addresses,
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
          address0: { line1: "", line2: "", city: "", stateSel: "", zip: "" },
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            {customerId ? "Edit Customer" : "Add Customer"}
          </h2>
          <div className="text-xs text-white/70">
            {loadingStates ? "Loading states…" : `${states.length} states loaded`}
          </div>
        </div>

        {globalError && (
          <div className="text-sm text-red-100 bg-red-500/30 border border-red-400/50 rounded px-3 py-2">
            {globalError}
          </div>
        )}

        {/* Name */}
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm text-white/90">Name</label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400
                        border ${errors.name ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"}
                        focus:outline-none`}
          />
          {errors.name && <p className="text-xs text-red-100">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-white/90">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400
                        border ${errors.email ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"}
                        focus:outline-none`}
          />
          {errors.email && <p className="text-xs text-red-100">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label htmlFor="phone" className="text-sm text-white/90">Phone</label>
          <input
            id="phone"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="e.g. +91 98765 43210"
            autoComplete="tel"
            inputMode="tel"
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

            {/* State dropdown (value can be code OR id-string) */}
            <select
              value={form.address0.stateSel || ""}
              onChange={(e) => setAddr("stateSel", e.target.value)}
              disabled={loadingStates}
              className="rounded-lg px-3 py-2 bg-white text-gray-900 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            >
              <option value="">-- Select State --</option>
              {states.map((s) => (
                <option key={s.id} value={s.code ?? String(s.id)}>
                  {s.label ?? `${s.code ?? ""} ${s.name ?? ""}`.trim()}
                </option>
              ))}
            </select>

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
