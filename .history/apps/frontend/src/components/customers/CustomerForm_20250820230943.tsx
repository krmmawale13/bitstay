import { useEffect, useState } from "react";
import {
  type Customer,
  UpsertCustomer,
  getCustomerById,
  listStates, // <-- add in services
} from "@/services/customers.service";

type StateOption = {
  id: number;
  code?: string;
  name: string;
  label: string;
};

type Address0 = {
  line1: string;
  line2?: string;
  city?: string;
  stateId?: number;    // <-- prefer ID
  stateCode?: string;  // <-- fallback if no ID
  zip?: string;
};

export default function CustomerForm({ customerId, onSuccess, onCancel }: Props) {
  // ...existing state
  const [states, setStates] = useState<StateOption[]>([]);

  useEffect(() => {
    listStates()
      .then(setStates)
      .catch(() => console.error("Failed to load states"));
  }, []);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    getCustomerById(customerId)
      .then((data: Customer | null) => {
        if (!data) {
          setGlobalError("Customer not found");
          return;
        }
        const first = (data?.addresses?.[0] ?? {}) as ApiAddress;

        let stateId: number | undefined;
        let stateCode: string | undefined;

        if (typeof first.state === "object" && first.state) {
          // try to match with dropdown
          const match = states.find((s) => s.code === first.state?.code);
          stateId = match?.id;
          stateCode = first.state?.code ?? "";
        }

        setForm({
          name: data?.name ?? "",
          email: data?.email ?? "",
          phone: data?.phone ?? "",
          address0: {
            line1: first.line1 ?? "",
            line2: first.line2 ?? "",
            city: first.city ?? "",
            stateId,
            stateCode,
            zip: first.zip ?? "",
          },
        });
      })
      .catch(() => setGlobalError("Failed to load customer details"))
      .finally(() => setLoading(false));
  }, [customerId, states]);

  // ...

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setGlobalError(null);
    if (!validate()) return;

    const addrPayload: any = {
      line1: form.address0.line1.trim(),
      line2: form.address0.line2?.trim() || undefined,
      city: form.address0.city?.trim() || undefined,
      zip: form.address0.zip?.trim() || undefined,
    };
    if (form.address0.stateId) addrPayload.stateId = form.address0.stateId;
    else if (form.address0.stateCode) addrPayload.stateCode = form.address0.stateCode;

    const payload: Partial<Customer> & { addresses?: typeof addrPayload[] } = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      addresses: form.address0.line1.trim() ? [addrPayload] : [],
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
          address0: { line1: "", line2: "", city: "", stateId: undefined, stateCode: "", zip: "" },
        });
      }
    } catch (err: any) {
      setGlobalError(err?.response?.data?.message || err?.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="...">
      <form onSubmit={handleSubmit} className="...">
        {/* ... other fields */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={form.address0.city}
            onChange={(e) => setAddr("city", e.target.value)}
            placeholder="City"
            className="..."
          />

          {/* State dropdown */}
          <select
            value={form.address0.stateId ?? ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                address0: {
                  ...p.address0,
                  stateId: e.target.value ? Number(e.target.value) : undefined,
                  stateCode: undefined,
                },
              }))
            }
            className="rounded-lg px-3 py-2 bg-white text-gray-900 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
          >
            <option value="">Select State</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <input
            value={form.address0.zip}
            onChange={(e) => setAddr("zip", e.target.value)}
            placeholder="ZIP"
            className="..."
          />
        </div>
      </form>
    </div>
  );
}
