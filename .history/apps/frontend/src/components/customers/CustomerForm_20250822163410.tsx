// apps/frontend/src/components/customers/CustomerForm.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Customer,
  UpsertCustomer,
  getCustomerById,
  getStates,
  getDistricts,
  getIdTypes,
} from "@/services/customers.service";

interface Props {
  customerId?: number; // undefined = Add, number = Edit
  onSuccess: () => void;
  onCancel: () => void;
}

// ---- Dropdown DTOs ----
type Option = { id: number; name: string };
type District = { id: number; name: string; stateId: number };

// ---- UI Address (single block) ----
type AddressForm = {
  line1: string;
  line2?: string;
  city?: string;
  stateId?: number | ""; // controlled select
  districtId?: number | "";
  pincode?: string;
};

export default function CustomerForm({ customerId, onSuccess, onCancel }: Props) {
  // -------- Form state --------
  const [form, setForm] = useState<{
    name: string;
    email?: string | null;
    phone?: string | null;
    idTypeId?: number | null;
    idNumber?: string | null;
    dob?: string | null; // ISO
    gender?: string | null;
    nationality?: string | null;
    consent?: boolean;
    address0: AddressForm;
  }>(() => ({
    name: "",
    email: "",
    phone: "",
    idTypeId: null,
    idNumber: "",
    dob: "",
    gender: "",
    nationality: "",
    consent: false,
    address0: { line1: "", line2: "", city: "", stateId: "", districtId: "", pincode: "" },
  }));

  // -------- UI state --------
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState<boolean>(!!customerId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // -------- Metadata --------
  const [states, setStates] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [idTypes, setIdTypes] = useState<Option[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);

  /* -------------------------- Load static dropdowns ------------------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingStates(true);
        const [st, it] = await Promise.all([getStates(), getIdTypes()]);
        if (!mounted) return;
        setStates(st ?? []);
        setIdTypes(it ?? []);
      } catch {
        if (mounted) {
          setStates([]);
          setIdTypes([]);
        }
      } finally {
        if (mounted) setLoadingStates(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------------------- Load for edit ------------------------------ */
  useEffect(() => {
    if (!customerId) return;
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const data = await getCustomerById(customerId);
        if (!mounted || !data) return;

        const a0 = (data.addresses?.[0] ?? {}) as any;

        const stateId: number | "" =
          typeof a0?.stateId === "number"
            ? a0.stateId
            : typeof (a0?.state?.id as number) === "number"
            ? (a0.state.id as number)
            : "";

        const districtId: number | "" =
          typeof a0?.districtId === "number"
            ? a0.districtId
            : typeof (a0?.district?.id as number) === "number"
            ? (a0.district.id as number)
            : "";

        setForm({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          idTypeId:
            typeof (data as any)?.idTypeId === "number"
              ? (data as any).idTypeId
              : (data as any)?.idType?.id ?? null,
          idNumber: (data as any)?.idNumber ?? "",
          dob: data?.dob ? new Date(data.dob as unknown as string).toISOString().slice(0, 10) : "",
          gender: (data as any)?.gender ?? "",
          nationality: (data as any)?.nationality ?? "",
          consent: !!(data as any)?.consent,
          address0: {
            line1: a0?.line1 ?? "",
            line2: a0?.line2 ?? "",
            city: a0?.city ?? "",
            stateId,
            districtId,
            pincode: a0?.pincode ?? a0?.zip ?? "",
          },
        });

        // Preload districts for selected state
        if (stateId && typeof stateId === "number") {
          setLoadingDistricts(true);
          try {
            const d = await getDistricts(stateId);
            if (mounted) setDistricts(d ?? []);
          } finally {
            if (mounted) setLoadingDistricts(false);
          }
        }
      } catch (e: any) {
        const msg =
          e?.response?.status === 404
            ? "Customer not found"
            : e?.response?.status === 403
            ? "You don't have access to this customer"
            : e?.message || "Failed to load customer";
        setGlobalError(msg);
        try {
          (window as any).__toast?.push?.({ type: "error", message: msg });
        } catch {}
        setTimeout(() => onCancel(), 500);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [customerId, onCancel]);

  /* ----------------------- Load districts on state change ------------------- */
  useEffect(() => {
    const sid = form.address0.stateId;
    if (!sid || typeof sid !== "number") {
      setDistricts([]);
      setForm((p) => ({ ...p, address0: { ...p.address0, districtId: "" } }));
      return;
    }

    let mounted = true;
    setLoadingDistricts(true);
    (async () => {
      try {
        const rows = await getDistricts(sid);
        if (!mounted) return;
        setDistricts(rows ?? []);
        // if current district doesn't belong, reset it
        setForm((p) => {
          const current = p.address0.districtId;
          const ok =
            typeof current === "number" &&
            (rows ?? []).some((d) => d.id === current);
          return ok ? p : { ...p, address0: { ...p.address0, districtId: "" } };
        });
      } catch {
        if (mounted) setDistricts([]);
      } finally {
        if (mounted) setLoadingDistricts(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [form.address0.stateId]);

  /* ----------------------------- Helpers / setters -------------------------- */
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [String(key)]: "" }));
    setGlobalError(null);
  };

  const setAddr = <K extends keyof AddressForm>(key: K, value: AddressForm[K]) => {
    setForm((p) => ({ ...p, address0: { ...p.address0, [key]: value } }));
    setErrors((e) => ({ ...e, [`address0.${String(key)}`]: "" }));
    setGlobalError(null);
  };

  /* ------------------------------- Validation ------------------------------- */
  // name: letters, spaces, ., -, ' allowed; length 2..80
  const namePattern = useMemo(() => /^[A-Za-z .'-]{2,80}$/, []);
  // simple email (good enough for UI)
  const emailPattern = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);
  // allow digits, +, -, space; but count 10..15 digits
  const phoneViewPattern = useMemo(() => /^[0-9+\- \t]{7,20}$/, []);
  const digitCount = (s?: string | null) => (s ? (s.match(/\d/g) || []).length : 0);

  const validate = () => {
    const e: Record<string, string> = {};
    // Name
    const name = form.name?.trim() || "";
    if (!name) e.name = "Name is required";
    else if (!namePattern.test(name)) e.name = "Only letters, spaces, . - ' (2–80 chars)";

    // Email (optional)
    if (form.email && form.email.trim() && !emailPattern.test(form.email.trim())) {
      e.email = "Invalid email format";
    }

    // Phone (optional, but if present must have 10–15 digits)
    if (form.phone && form.phone.trim()) {
      const viewOk = phoneViewPattern.test(form.phone);
      const digits = digitCount(form.phone);
      if (!viewOk || digits < 10 || digits > 15) {
        e.phone = "Enter a valid phone (10–15 digits; +, -, spaces allowed)";
      }
    }

    // Address block validation: if any field typed, require line1
    const A = form.address0;
    const anyAddr = A.line1 || A.line2 || A.city || A.pincode || A.stateId || A.districtId;
    if (anyAddr && !A.line1?.trim()) e["address0.line1"] = "Address line 1 is required";

    // Pincode: if purely digits, enforce exactly 6; else allow 3–10 mixed
    if (A.pincode && A.pincode.trim()) {
      const p = A.pincode.trim();
      if (/^\d+$/.test(p)) {
        if (p.length !== 6) e["address0.pincode"] = "Pincode must be 6 digits";
      } else if (!/^[0-9A-Za-z\- ]{3,10}$/.test(p)) {
        e["address0.pincode"] = "Invalid pincode";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* -------------------------------- Submit ---------------------------------- */
  const resetForm = () =>
    setForm({
      name: "",
      email: "",
      phone: "",
      idTypeId: null,
      idNumber: "",
      dob: "",
      gender: "",
      nationality: "",
      consent: false,
      address0: { line1: "", line2: "", city: "", stateId: "", districtId: "", pincode: "" },
    });

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (saving || loading) return;
    setGlobalError(null);

    if (!validate()) {
      try {
        (window as any).__toast?.push?.({
          type: "error",
          message: "Please fix the highlighted fields",
        });
      } catch {}
      // focus first invalid input
      const firstKey = Object.keys(errors)[0];
      if (firstKey && formRef.current) {
        const el = formRef.current.querySelector<HTMLElement>(
          `[name="${firstKey.replace("address0.", "")}"]`
        );
        el?.focus?.();
      }
      return;
    }

    const addr = form.address0;
    const addresses =
      addr.line1?.trim()
        ? [
            {
              line1: addr.line1.trim(),
              line2: addr.line2?.trim() || null,
              city: addr.city?.trim() || null,
              stateId: typeof addr.stateId === "number" ? addr.stateId : null,
              districtId: typeof addr.districtId === "number" ? addr.districtId : null,
              pincode: addr.pincode?.trim() || null,
            },
          ]
        : [];

    const payload: Partial<Customer> = {
      name: form.name.trim(),
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      idTypeId: form.idTypeId ?? null,
      idNumber: form.idNumber?.trim() || null,
      dob: form.dob || null, // input[type=date] gives 'YYYY-MM-DD'
      gender: form.gender || null,
      nationality: form.nationality?.trim() || null,
      consent: !!form.consent,
      addresses,
    };

    try {
      setSaving(true);
      await UpsertCustomer(customerId ? { id: customerId, ...payload } : payload);

      // 🔔 success toast
      try {
        (window as any).__toast?.push?.({
          type: "success",
          message: customerId ? "Customer updated" : "Customer created",
          description: form.name || undefined,
        });
      } catch {}

      onSuccess();

      // reset only in "Add" mode
      if (!customerId) resetForm();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save customer";
      setGlobalError(msg);
      try {
        (window as any).__toast?.push?.({ type: "error", message: "Save failed", description: msg });
      } catch {}
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------- Shortcuts -------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  if (loading) {
    return <div className="text-white/80 p-4">Loading…</div>;
  }

  /* --------------------------------- UI ------------------------------------ */
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
        ref={formRef}
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-3xl rounded-2xl shadow-2xl
                   bg-white/10 backdrop-blur-xl ring-1 ring-white/20 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            {customerId ? "Edit Customer" : "Add Customer"}
          </h2>
          <div className="text-xs text-white/70">
            {loadingStates ? "Loading states…" : `${states.length} states`}
          </div>
        </div>

        {globalError && (
          <div className="text-sm text-red-100 bg-red-500/30 border border-red-400/50 rounded px-3 py-2">
            {globalError}
          </div>
        )}

        {/* Basic */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1 md:col-span-1">
            <label htmlFor="name" className="text-sm text-white/90">
              Name <span className="text-red-200">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Full name"
              autoComplete="name"
              aria-invalid={!!errors.name}
              className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400
                        border ${errors.name ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"}
                        focus:outline-none`}
            />
            {errors.name && <p className="text-xs text-red-100">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm text-white/90">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400
                        border ${errors.email ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"}
                        focus:outline-none`}
            />
            {errors.email && <p className="text-xs text-red-100">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm text-white/90">Phone</label>
            <input
              id="phone"
              name="phone"
              value={form.phone ?? ""}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="e.g. +91 98765 43210"
              autoComplete="tel"
              inputMode="tel"
              aria-invalid={!!errors.phone}
              className={`w-full rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400
                        border ${errors.phone ? "border-red-400 ring-2 ring-red-300" : "border-white/30 focus:ring-2 focus:ring-blue-300"}
                        focus:outline-none`}
            />
            {errors.phone && <p className="text-xs text-red-100">{errors.phone}</p>}
          </div>
        </div>

        {/* KYC */}
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 space-y-3">
          <p className="text-sm font-medium text-white/90">KYC</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-white/80">ID Type</label>
              <select
                value={form.idTypeId ?? ""}
                onChange={(e) =>
                  setField("idTypeId", e.target.value ? Number(e.target.value) : null)
                }
                className="w-full rounded-lg px-3 py-2 bg-white text-gray-900 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              >
                <option value="">-- Select --</option>
                {idTypes.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/80">ID Number</label>
              <input
                value={form.idNumber ?? ""}
                onChange={(e) => setField("idNumber", e.target.value)}
                placeholder="e.g. AADHAAR / Passport"
                className="w-full rounded-lg px-3 py-2 bg-white text-gray-900 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/80">DOB</label>
              <input
                type="date"
                value={form.dob ?? ""}
                onChange={(e) => setField("dob", e.target.value || "")}
                className="w-full rounded-lg px-3 py-2 bg-white text-gray-900 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/80">Gender</label>
              <select
                value={form.gender ?? ""}
                onChange={(e) => setField("gender", e.target.value || "")}
                className="w-full rounded-lg px-3 py-2 bg-white text-gray-900 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              >
                <option value="">-- Select --</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs text-white/80">Nationality</label>
              <input
                value={form.nationality ?? ""}
                onChange={(e) => setField("nationality", e.target.value)}
                placeholder="e.g. Indian"
                className="w-full rounded-lg px-3 py-2 bg-white text-gray-900 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-white/90 mt-1">
              <input
                type="checkbox"
                checked={!!form.consent}
                onChange={(e) => setField("consent", e.target.checked)}
                className="h-4 w-4"
              />
              Consent for communications
            </label>
          </div>
        </div>

        {/* Address Group -> maps to addresses[0] */}
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 space-y-3">
          <p className="text-sm font-medium text-white/90">Address</p>

          <input
            name="address0.line1"
            value={form.address0.line1}
            onChange={(e) => setAddr("line1", e.target.value)}
            placeholder="Line 1"
            aria-invalid={!!errors["address0.line1"]}
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

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              value={form.address0.city}
              onChange={(e) => setAddr("city", e.target.value)}
              placeholder="City"
              className="rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />

            {/* State */}
            <select
              value={form.address0.stateId ?? ""}
              onChange={(e) =>
                setAddr("stateId", e.target.value ? Number(e.target.value) : "")
              }
              disabled={loadingStates}
              className="rounded-lg px-3 py-2 bg-white text-gray-900 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            >
              <option value="">-- State --</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* District (depends on state) */}
            <select
              value={form.address0.districtId ?? ""}
              onChange={(e) =>
                setAddr("districtId", e.target.value ? Number(e.target.value) : "")
              }
              disabled={loadingDistricts || !form.address0.stateId}
              className="rounded-lg px-3 py-2 bg-white text-gray-900 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            >
              <option value="">-- District --</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <input
              name="address0.pincode"
              value={form.address0.pincode ?? ""}
              onChange={(e) => setAddr("pincode", e.target.value)}
              placeholder="Pincode"
              aria-invalid={!!errors["address0.pincode"]}
              className={`rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-white/30 focus:ring-2 focus:ring-blue-300 focus:outline-none ${
                errors["address0.pincode"] ? "ring-2 ring-red-300 border-red-400" : ""
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving || (!customerId && loadingStates)}
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
