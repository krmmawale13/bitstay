import { useState } from "react";
import { createPortal } from "react-dom";
import http from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";

type RoleEnum =
  | "ADMIN"
  | "MANAGER"
  | "RECEPTIONIST"
  | "CASHIER"
  | "WAITER"
  | "HOUSEKEEPING";

type CreateUserResponse = {
  user: { id: number; name: string; email: string; role: RoleEnum };
  tenantId: number;
  tempPassword?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (payload: CreateUserResponse) => void;
};

export default function AddUserModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleEnum>("RECEPTIONIST");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ tempPassword?: string; userEmail?: string } | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("RECEPTIONIST");
    setPassword("");
    setSubmitting(false);
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const copy = (txt: string) => {
    if (typeof navigator !== "undefined") navigator.clipboard.writeText(txt);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tenantId =
        (typeof window !== "undefined" &&
          (localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId"))) || "";

      if (!tenantId) {
        alert("Select a tenant first.");
        return;
      }
      const cu = getCurrentUser();
      if (cu?.role !== "ADMIN") {
        alert("Only ADMIN can add users.");
        return;
      }

      const { data } = await http.post<CreateUserResponse>(
        "/users",
        { name, email, role, password: password || undefined },
        { headers: { "x-tenant-id": tenantId } }
      );

      setResult({
        tempPassword: data?.tempPassword,
        userEmail: data?.user?.email ?? email,
      });
      onCreated?.(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) alert("Session expired. Please log in again.");
      else if (status === 403) alert("Access denied. Check your role or tenant.");
      else alert("Could not create user. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-6">
        {/* Title bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              {/* simple plus avatar */}
              <span className="text-lg">+</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Add User (Staff)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Create a staff account for the current tenant</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form / Result */}
        {!result ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name">
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Priya Sharma"
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
              />
            </Field>

            <Field label="Role">
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleEnum)}
              >
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="CASHIER">Cashier</option>
                <option value="WAITER">Waiter</option>
                <option value="HOUSEKEEPING">Housekeeping</option>
              </select>
            </Field>

            <Field label={<span>Password <span className="opacity-60">(optional)</span></span>}>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to auto-generate"
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-200 bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                           bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                           shadow-sm active:scale-[0.98] disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Card>
              <div className="text-sm">User created</div>
              <div className="font-medium">{result.userEmail}</div>
            </Card>

            {result.tempPassword ? (
              <Card>
                <div className="text-sm mb-1">Temporary password</div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 rounded bg-black/10 dark:bg-white/10">
                    {result.tempPassword}
                  </code>
                  <button
                    onClick={() => copy(result.tempPassword!)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-900
                               bg-white hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:ring-slate-700 transition"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs opacity-70 mt-2">
                  Ask the user to login and change their password.
                </p>
              </Card>
            ) : (
              <div className="text-sm">
                No temp password (you provided one). The user can login now.
              </div>
            )}

            <div className="flex items-center justify-end pt-1">
              <button
                onClick={handleClose}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                           bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                           shadow-sm active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60 p-3">
      {children}
    </div>
  );
}
