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
    setName(""); setEmail(""); setRole("RECEPTIONIST"); setPassword("");
    setSubmitting(false); setResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const copy = (txt: string) => {
    if (typeof navigator !== "undefined") navigator.clipboard.writeText(txt);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tenantId = localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId") || "";
      if (!tenantId) return alert("Select a tenant first.");
      const cu = getCurrentUser();
      if (cu?.role !== "ADMIN") return alert("Only ADMIN can add users.");

      const { data } = await http.post<CreateUserResponse>(
        "/users",
        { name, email, role, password: password || undefined },
        { headers: { "x-tenant-id": tenantId } }
      );

      setResult({ tempPassword: data?.tempPassword, userEmail: data?.user?.email ?? email });
      onCreated?.(data);
    } finally { setSubmitting(false); }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800
                      bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-6 space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg 
                             bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold">+</span>
            Add Staff User
          </h2>
          <button onClick={handleClose}
            className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition">✕</button>
        </div>

        {!result ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Priya Sharma" />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" />
            </Field>
            <Field label="Role">
              <select value={role} onChange={(e) => setRole(e.target.value as RoleEnum)}
                className="w-full rounded-xl border px-3 py-2 text-sm shadow-sm 
                           border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900
                           focus:ring-2 focus:ring-indigo-500">
                {["ADMIN","MANAGER","RECEPTIONIST","CASHIER","WAITER","HOUSEKEEPING"].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label={<span>Password <span className="opacity-60">(optional)</span></span>}>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to auto-generate" />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 
                           dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="px-4 py-2 rounded-xl font-medium text-white shadow-sm 
                           bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                           disabled:opacity-50">
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
            {result.tempPassword && (
              <Card>
                <div className="text-sm mb-1">Temporary password</div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 rounded bg-black/10 dark:bg-white/10">{result.tempPassword}</code>
                  <button onClick={() => copy(result.tempPassword!)}
                    className="px-3 py-1.5 rounded-lg border text-sm font-medium 
                               bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700">
                    Copy
                  </button>
                </div>
              </Card>
            )}
            <div className="flex justify-end">
              <button onClick={handleClose}
                className="px-4 py-2 rounded-xl font-medium text-white shadow-sm 
                           bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500">
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
  return <div className="space-y-1"><label className="text-sm font-medium">{label}</label>{children}</div>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className="w-full rounded-xl border px-3 py-2 text-sm shadow-sm
                 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900
                 focus:ring-2 focus:ring-indigo-500" />
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3">{children}</div>;
}
