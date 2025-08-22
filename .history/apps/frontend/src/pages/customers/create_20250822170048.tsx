// apps/frontend/src/pages/customers/create.tsx
import CustomerForm from "@/components/customers/CustomerForm";
import MainLayout from "@/layouts/MainLayout";
import { useRouter } from "next/router";
import { useEffect } from "react";

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

export default function CreateCustomerPage() {
  const router = useRouter();

  // small UX nicety: ensure page starts at top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                ➕ Create Customer
              </h1>
              <p className="mt-1 text-gray-700 dark:text-gray-400 text-sm">
                Fill the details below and click <strong>Save</strong>.
              </p>
            </div>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                router.push("/customers");
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
              onSuccess={() => {
                notify("success", "Customer created");
                window.scrollTo({ top: 0, behavior: "smooth" });
                router.push("/customers");
              }}
              onCancel={() => {
                notify("info", "Creation cancelled");
                window.scrollTo({ top: 0, behavior: "smooth" });
                router.push("/customers");
              }}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
