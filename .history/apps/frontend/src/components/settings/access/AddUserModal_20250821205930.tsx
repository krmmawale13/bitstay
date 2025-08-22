import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import http from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";

const ROLES = ["ADMIN","MANAGER","RECEPTIONIST","CASHIER","WAITER","HOUSEKEEPING"] as const;
type RoleEnum = typeof ROLES[number];

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
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // SSR-safe portal target
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const reset = () => {
    setName("");
    setEmail("");
    setRole("RECEPTIONIST");
    setPassword("");
    setSubmitting(false);
    setResult(null);
    setError(null);
    setCopied(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isValidEmail = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const tenantId =
      (typeof window !== "undefined" &&
        (localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId"))) || "";

    if (!tenantId) {
      setError("Select a tenant first.");
      return;
    }

    const cu = getCurrentUser();
    if (cu?.role !== "ADMIN") {
      setError("Only ADMIN can add users.");
      return;
    }

    if (!isValidEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      // NOTE: Authorization bearer + x-tenant-id will be added by axios interceptor in http.ts
      const { data } = await http.post<CreateUserResponse>("/users", {
        name,
        email,
        role,
        password: password || undefined,
      });

      setResult({
        tempPassword: data?.tempPassword,
        userEmail: data?.user?.email ?? email,
      });
      onCreated?.(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.message === "string" ? err.message : null) ||
        "Could not create user. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  if (!open || !portalTarget) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={handleClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800
                   bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-6"
      >
        {/* Title bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600
                            text-white flex items-center justify-center shadow-sm">
              <span className="text-lg">+</span>
            </div>
            <div>
              <h2 id="add-user-title" className="text-lg font-semibold">Add User (Staff)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a staff account for the current tenant
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200/60 dark:border-red-800/60
                          bg-red-50/70 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-3 py-2 text-sm">
            {String(error)}
          </div>
        )}

        {/* Form / Result */}
        {!result ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name" htmlFor="name">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Priya Sharma"
                autoFocus
              />
            </Field>

            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                aria-invalid={!isValidEmail}
              />
            </Field>

            <Field label="Role" htmlFor="role">
              <select
                id="role"
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700
                           bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleEnum)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>

            <Field label={<span>Password <span className="opacity-60">(optional)</span></span>} htmlFor="password">
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to auto-generate"
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium
                           text-slate-900 dark:text-slate-200 bg-white hover:bg-slate-50
                           ring-1 ring-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:ring-slate-700"
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
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium
                               text-slate-900 bg-white hover:bg-slate-50 ring-1 ring-slate-200
                               dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:ring-slate-700 transition"
                    aria-live="polite"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs opacity-70 mt-2">
                  Ask the user to log in and change their password.
                </p>
              </Card>
            ) : (
              <div className="text-sm">
                No temp password (you provided one). The user can log in now.
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
    portalTarget
  );
}

function Field({
  label,
  children,
  htmlFor,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700
                 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm
                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60 p-3">
      {children}
    </div>
  );
}
