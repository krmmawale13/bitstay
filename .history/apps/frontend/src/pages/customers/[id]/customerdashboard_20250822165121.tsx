// apps/frontend/src/pages/customers/[id]/customerdashboard.tsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import {
  getCustomerById,
  deleteCustomer,
  type Customer,
} from "@/services/customers.service";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Mail,
  Phone,
  IdCard,
  AlertTriangle,
} from "lucide-react";
import CustomerForm from "@/components/customers/CustomerForm";

/* ------------------------- non-breaking toast helper ------------------------- */
function notify(
  type: "success" | "error" | "info",
  message: string,
  opts?: { description?: string }
) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  if (api && typeof api.push === "function") {
    api.push({ type, message, description: opts?.description });
  } else {
    console.log(`[toast:${type}] ${message}`, opts?.description ?? "");
  }
}

/* ---------------------------------- utils ---------------------------------- */
function fmtDate(d?: string | null) {
  if (!d) return "—";
  const iso = typeof d === "string" ? d : String(d);
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString();
}
function formatAddress(a: any) {
  if (!a) return "—";
  const stateName =
    typeof a.state === "object" ? (a.state?.name ?? a.state?.code) : a.stateName;
  const districtName =
    typeof a.district === "object" ? a.district?.name : a.districtName;
  return [a.line1, a.line2, a.city, districtName, stateName, a.pincode ?? a.zip]
    .filter(Boolean)
    .join(", ");
}

/* --------------------------------- page ---------------------------------- */
export default function CustomerDashboardPage() {
  const router = useRouter();
  const { id } = router.query;

  const customerId = useMemo(() => {
    if (!router.isReady) return undefined;
    const raw = Array.isArray(id) ? id[0] : id;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [id, router.isReady]);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // invalid id → back to list
  useEffect(() => {
    if (!router.isReady) return;
    if (customerId === undefined) {
      notify("error", "Invalid customer ID in URL");
      router.replace("/customers");
    }
  }, [customerId, router]);

  // fetch details
  useEffect(() => {
    if (!customerId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const c = await getCustomerById(customerId);
        if (!mounted) return;
        setCustomer(c);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load customer";
        notify("error", "Customer not found", { description: msg });
        // 404/403 → back to list
        router.replace("/customers");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [customerId, router]);

  const onDeleteConfirm = async () => {
    if (!customerId) return;
    try {
      setBusy(true);
      await deleteCustomer(customerId);
      notify("success", "Customer deleted");
      router.replace("/customers");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to delete customer";
      notify("error", "Delete failed", { description: msg });
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  };

  // Skeletons
  if (!router.isReady || loading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-40 xl:col-span-3 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/customers")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm
                         bg-slate-200 hover:bg-slate-300
                         dark:bg-slate-700 dark:hover:bg-slate-600 transition"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h1 className="text-2xl font-bold">Customer Dashboard</h1>
          </div>

          {customer && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2
                           bg-amber-500/90 hover:bg-amber-500 text-white shadow-sm"
              >
                <Edit3 size={16} />
                Edit
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2
                           bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white shadow-sm"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {!customer ? (
          <ErrorCard
            title="Customer not found"
            subtitle="This record may be deleted or you may not have access."
            onBack={() => router.replace("/customers")}
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-3">
            {/* Profile / Summary */}
            <div className="xl:col-span-1 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-semibold">
                  {customer.name?.trim()?.charAt(0)?.toUpperCase() || "C"}
                </div>
                <div>
                  <div className="text-lg font-semibold">{customer.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">ID #{customer.id}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Tenant: {customer.tenantId ?? "—"}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">
                    {customer.email || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">
                    {customer.phone || "—"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500">Created</div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {fmtDate(customer.createdAt)}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500">Updated</div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {fmtDate(customer.updatedAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* KYC + Contact */}
            <div className="xl:col-span-2 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-100 dark:border-slate-800">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <IdCard size={18} /> KYC Details
                </h2>
                <div className="space-y-2 text-sm">
                  <KV label="ID Type">
                    {(customer as any).idType?.name ??
                      (typeof (customer as any).idTypeId === "number"
                        ? `#${(customer as any).idTypeId}`
                        : "—")}
                  </KV>
                  <KV label="ID Number">{(customer as any).idNumber ?? "—"}</KV>
                  <KV label="DOB">{fmtDate((customer as any).dob as any)}</KV>
                  <KV label="Gender">{(customer as any).gender || "—"}</KV>
                  <KV label="Nationality">{(customer as any).nationality || "—"}</KV>
                  <KV label="Consent">{(customer as any).consent ? "Yes" : "No"}</KV>
                </div>
              </div>

              {/* Addresses */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-100 dark:border-slate-800">
                <h2 className="font-semibold text-lg mb-4">Addresses</h2>
                {customer.addresses?.length ? (
                  <ul className="space-y-3">
                    {customer.addresses.map((a: any, idx: number) => (
                      <li
                        key={idx}
                        className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 text-sm"
                      >
                        <div className="font-medium text-slate-800 dark:text-slate-100">
                          {formatAddress(a)}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500">No addresses on file.</div>
                )}
              </div>
            </div>

            {/* Future: Bookings / Invoices preview */}
            <div className="xl:col-span-3 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Activity</h2>
                <div className="text-xs text-slate-500">Coming soon</div>
              </div>
              <div className="text-sm text-slate-500">
                Bookings, POS orders, invoices and notes will appear here.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT MODAL (inline, reuses your CustomerForm) */}
      {editOpen && customer && (
        <Modal onClose={() => setEditOpen(false)} title={`Edit #${customer.id}`}>
          <CustomerForm
            customerId={customer.id}
            onSuccess={async () => {
              notify("success", "Customer updated");
              setEditOpen(false);
              // refresh details
              try {
                const fresh = await getCustomerById(customer.id);
                setCustomer(fresh);
              } catch (e: any) {
                notify("error", "Refresh failed", {
                  description: e?.message || "Could not reload customer",
                });
              }
            }}
            onCancel={() => setEditOpen(false)}
          />
        </Modal>
      )}

      {/* DELETE CONFIRM MODAL */}
      {confirmOpen && customer && (
        <ConfirmModal
          title="Delete customer?"
          message={`This will permanently remove "${customer.name}" and related addresses.`}
          confirmText={busy ? "Deleting…" : "Delete"}
          confirmVariant="danger"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={onDeleteConfirm}
          disabled={busy}
        />
      )}
    </MainLayout>
  );
}

/* ------------------------------ small pieces ------------------------------ */

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1 last:border-b-0">
      <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <span className="text-slate-800 dark:text-slate-100">{children}</span>
    </div>
  );
}

function ErrorCard({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 p-6">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-rose-500 text-white flex items-center justify-center">
          <AlertTriangle size={18} />
        </div>
        <div>
          <div className="font-semibold text-rose-800 dark:text-rose-200">{title}</div>
          {subtitle && (
            <div className="text-sm text-rose-700/80 dark:text-rose-300/80 mt-0.5">{subtitle}</div>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm
                         bg-white/70 hover:bg-white text-rose-800 ring-1 ring-rose-200
                         dark:bg-transparent dark:text-rose-200 dark:ring-rose-700 dark:hover:bg-rose-900/30"
            >
              <ArrowLeft size={14} />
              Back to Customers
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Modal --------------------------------- */

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={ref}
        className="relative z-[101] w-full max-w-4xl rounded-2xl border border-white/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/20 dark:border-slate-800">
          <div className="text-sm font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <div className="max-h-[80vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  confirmText = "Confirm",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  disabled,
}: {
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-[101] w-full max-w-md rounded-2xl border border-white/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500 text-white flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{message}</div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={disabled}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`rounded-lg px-3 py-1.5 text-sm text-white shadow-sm ${
              confirmVariant === "danger"
                ? "bg-rose-600 hover:bg-rose-500 disabled:opacity-60"
                : "bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
