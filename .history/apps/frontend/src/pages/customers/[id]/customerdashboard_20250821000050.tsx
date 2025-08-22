// apps/frontend/src/pages/customers/[id]/customerdashboard.tsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import {
  getCustomerById,
  deleteCustomer,
  type Customer,
} from "@/services/customers.service";
import { ArrowLeft, Edit3, Trash2, Mail, Phone, IdCard } from "lucide-react";

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

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { id } = router.query;

  const customerId = useMemo(() => {
    if (!router.isReady) return undefined;
    const raw = Array.isArray(id) ? id[0] : id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }, [id, router.isReady]);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    (async () => {
      try {
        const c = await getCustomerById(customerId);
        setCustomer(c);
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  const onDelete = async () => {
    if (!customerId) return;
    if (!confirm("Delete this customer? This action cannot be undone.")) return;
    try {
      setBusy(true);
      await deleteCustomer(customerId);
      router.replace("/customers");
    } finally {
      setBusy(false);
    }
  };

  if (!router.isReady) return null;

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
                onClick={() => router.push(`/customers/${customer.id}/edit`)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2
                           bg-amber-500/90 hover:bg-amber-500 text-white shadow-sm"
              >
                <Edit3 size={16} />
                Edit
              </button>
              <button
                onClick={onDelete}
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
        {loading ? (
          <div className="text-slate-500 italic">Loading customer details...</div>
        ) : !customer ? (
          <div className="text-rose-600 italic">Customer not found</div>
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
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                    <span className="font-medium text-slate-600 dark:text-slate-300">ID Type</span>
                    <span>
                      {(customer as any).idType?.name ??
                        (typeof (customer as any).idTypeId === "number" ? `#${(customer as any).idTypeId}` : "—")}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                    <span className="font-medium text-slate-600 dark:text-slate-300">ID Number</span>
                    <span>{(customer as any).idNumber ?? "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                    <span className="font-medium text-slate-600 dark:text-slate-300">DOB</span>
                    <span>{fmtDate((customer as any).dob as any)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                    <span className="font-medium text-slate-600 dark:text-slate-300">Gender</span>
                    <span>{(customer as any).gender || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                    <span className="font-medium text-slate-600 dark:text-slate-300">Nationality</span>
                    <span>{(customer as any).nationality || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-600 dark:text-slate-300">Consent</span>
                    <span className="inline-flex items-center">
                      {((customer as any).consent ? "Yes" : "No") as string}
                    </span>
                  </div>
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
    </MainLayout>
  );
}
