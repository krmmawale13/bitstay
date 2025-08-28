// apps/frontend/src/pages/hotels/create.tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import { hotelsService } from "@/services/property.service";
import { ArrowLeft, Building2, Loader2, Save } from "lucide-react";

/* ---------------- toast ---------------- */
function toast(
  type: "success" | "error" | "info",
  message: string,
  description?: string
) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  api?.push
    ? api.push({ type, message, description })
    : console.log(`[toast:${type}]`, message, description ?? "");
}

/* ---------------- helpers ---------------- */
function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type Errors = Partial<{
  name: string;
  address: string;
}>;

const NAME_MAX = 100;    // safe FE cap; BE accepts string
const ADDRESS_MAX = 250; // safe FE cap; BE accepts string | null

export default function HotelCreatePage() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const invalid = useMemo(() => Object.keys(errors).length > 0, [errors]);

  /* validate on mount/changes to provide instant hints */
  useEffect(() => {
    validateAndSet({ name, address }, setErrors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate(values: { name: string; address: string }): Errors {
    const e: Errors = {};
    const nm = values.name.trim();
    const addr = values.address.trim();

    if (!nm) e.name = "Hotel name is required.";
    else if (nm.length > NAME_MAX) e.name = `Name must be ≤ ${NAME_MAX} characters.`;

    if (addr && addr.length > ADDRESS_MAX) {
      e.address = `Address must be ≤ ${ADDRESS_MAX} characters.`;
    }
    return e;
  }

  function validateAndSet(
    values: { name: string; address: string },
    set: (e: Errors) => void
  ) {
    set(validate(values));
  }

  async function onSave(e?: React.FormEvent) {
    e?.preventDefault();
    const nextErrors = validate({ name, address });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast("error", "Please fix validation errors");
      return;
    }

    try {
      setBusy(true);
      const payload = {
        name: name.trim(),
        address: address.trim() || undefined,
      };
      const h = await hotelsService.create(payload);
      toast("success", "Hotel created");
      router.replace(`/hotels/${h.id}/edit`);
    } catch (err: any) {
      toast("error", "Create failed", err?.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/hotels")}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-sm">
                <Building2 size={18} />
              </div>
              <div className="text-2xl font-bold">New Hotel</div>
            </div>
          </div>

          <button
            form="hotel-create-form"
            type="submit"
            disabled={busy || invalid || !name.trim()}
            className={cls(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60",
              invalid && "animate-pulse"
            )}
            title={!name.trim() ? "Enter hotel name" : "Save"}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>

        {/* Form card */}
        <form
          id="hotel-create-form"
          onSubmit={onSave}
          className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 grid gap-4 sm:grid-cols-2"
        >
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="hotel-name">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="hotel-name"
              value={name}
              onChange={(e) => {
                const v = e.target.value;
                setName(v);
                validateAndSet({ name: v, address }, setErrors);
              }}
              maxLength={NAME_MAX + 10 /* UX guard, still validate */}
              placeholder="e.g., BitStay Residency"
              className={cls(
                "mt-1 w-full rounded-xl border bg-white dark:bg-slate-900 px-3 py-2 text-sm",
                errors.name ? "border-rose-400 dark:border-rose-500" : "border-slate-300 dark:border-slate-700"
              )}
              aria-invalid={!!errors.name}
              autoFocus
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.name ? (
                <ErrorHint>{errors.name}</ErrorHint>
              ) : (
                <span className="text-[11px] text-slate-400">Required</span>
              )}
              <CharCounter current={name.length} max={NAME_MAX} />
            </div>
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="hotel-address">
              Address
            </label>
            <textarea
              id="hotel-address"
              value={address}
              onChange={(e) => {
                const v = e.target.value;
                setAddress(v);
                validateAndSet({ name, address: v }, setErrors);
              }}
              rows={3}
              maxLength={ADDRESS_MAX + 20 /* UX guard */}
              placeholder="Street, City, State PIN"
              className={cls(
                "mt-1 w-full rounded-xl border bg-white dark:bg-slate-900 px-3 py-2 text-sm",
                errors.address ? "border-rose-400 dark:border-rose-500" : "border-slate-300 dark:border-slate-700"
              )}
              aria-invalid={!!errors.address}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.address ? (
                <ErrorHint>{errors.address}</ErrorHint>
              ) : (
                <span className="text-[11px] text-slate-400">Optional</span>
              )}
              <CharCounter current={address.length} max={ADDRESS_MAX} />
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

/* ---------------- small bits ---------------- */
function ErrorHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-rose-600 dark:text-rose-300 inline-flex items-center gap-1">
      {/* simple dot indicator instead of icon to keep it clean */}
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
      <span>{children}</span>
    </div>
  );
}

function CharCounter({ current, max }: { current: number; max: number }) {
  const warn = current > max;
  return (
    <span
      className={cls(
        "text-[11px] tabular-nums",
        warn ? "text-rose-600 dark:text-rose-400" : "text-slate-400"
      )}
      title={`${current}/${max}`}
    >
      {current}/{max}
    </span>
  );
}
