import { useState } from "react";
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

  const handleClose = () => {
    setName(""); setEmail(""); setRole("RECEPTIONIST"); setPassword("");
    setSubmitting(false); setResult(null); onClose();
  };

  const copy = (txt: string) => {
    if (typeof navigator !== "undefined") navigator.clipboard.writeText(txt);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // safety: ensure tenant header even if interceptor misses
      const tenantId =
        (typeof window !== "undefined" &&
          (localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId"))) || "";

      if (!tenantId) {
        alert("Please select a tenant first.");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      {/* dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800
                      bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add User (Staff)</h2>
          <button
            onClick={handleClose}
            className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!result ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name">
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Priya Sharma"
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
              />
            </Field>

            <Field label="Role">
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 focus:ring-2 focus:ring-indigo-500"
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

            <Field label={<>Password <span className="opacity-60">(optional)</span></>}>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to auto-generate"
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Card>
              <div className="text-sm">User created:</div>
              <div className="font-medium">{result.userEmail}</div>
            </Card>

            {result.tempPassword ? (
              <Card>
                <div className="text-sm mb-1">Temporary password:</div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 rounded bg-black/10 dark:bg-white/10">{result.tempPassword}</code>
                  <button
                    onClick={() => copy(result.tempPassword!)}
                    className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs opacity-70 mt-2">Ask the user to login and change their password.</p>
              </Card>
            ) : (
              <div className="text-sm">No temp password (you provided one). The user can login now.</div>
            )}

            <div className="flex items-center justify-end pt-1">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
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
    <div className="rounded-lg border border-slate-300 dark:border-slate-700 p-3">{children}</div>
  );
}
