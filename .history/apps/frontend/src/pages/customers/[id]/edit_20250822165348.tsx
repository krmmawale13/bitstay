// apps/frontend/src/pages/customers/[id]/edit.tsx
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import CustomerForm from "@/components/customers/CustomerForm";
import MainLayout from "@/layouts/MainLayout";

/** Non-breaking toast helper (uses window.__toast if present). */
function notify(
  type: "success" | "error" | "info",
  message: string,
  description?: string
) {
  if (typeof window === "undefined") return;
  const api = (window as any).__toast;
  if (api?.push) api.push({ type, message, description });
  else console.log(`[toast:${type}]`, message, description ?? "");
}

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = router.query;

  // Wait for router to be ready and coerce id -> number safely
  const customerId = useMemo(() => {
    if (!router.isReady) return undefined;
    const raw = Array.isArray(id) ? id[0] : id;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [id, router.isReady]);

  // Improve UX: if user lands here with invalid id, let them know + send back.
  useEffect(() => {
    if (!router.isReady) return;
    if (customerId === undefined) {
      notify("error", "Invalid customer ID in URL");
    }
  }, [customerId, router.isReady]);

  if (!router.isReady) return null;

  if (customerId === undefined) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="rounded-xl border border-rose-200/70 bg-rose-50 px-5 py-4 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/30 dark:text-rose-200">
            Invalid customer id
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                ✏️ Edit Customer
              </h1>
              <p className="mt-1 text-gray-700 dark:text-gray-400 text-sm">
                Update customer details below and click <strong>Save</strong>.
              </p>
            </div>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                router.back();
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow transition-colors
                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                         dark:from-blue-500 dark:to-indigo-500"
            >
              ← Back
            </button>
          </div>

          {/* Card Form */}
          <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur rounded-xl shadow-lg p-6 border border-blue-100/80 dark:border-blue-800/50">
            <CustomerForm
              customerId={customerId}
              onSuccess={() => {
                notify("success", "Customer saved");
                window.scrollTo({ top: 0, behavior: "smooth" });
                router.replace("/customers");
              }}
              onCancel={() => {
                notify("info", "Edit cancelled");
                window.scrollTo({ top: 0, behavior: "smooth" });
                router.back();
              }}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
