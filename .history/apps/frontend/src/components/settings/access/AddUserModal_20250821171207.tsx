import { useState } from "react";
import http from "@/lib/http";

type RoleEnum =
  | "ADMIN"
  | "MANAGER"
  | "RECEPTIONIST"
  | "CASHIER"
  | "WAITER"
  | "HOUSEKEEPING";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (payload: {
    user: { id: number; name: string; email: string; role: RoleEnum };
    tenantId: number;
    tempPassword?: string;
  }) => void;
};

export default function AddUserModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleEnum>("RECEPTIONIST");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    tempPassword?: string;
    userEmail?: string;
  } | null>(null);

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

  const copy = (text: string) => {
    if (typeof navigator !== "undefined") navigator.clipboard.writeText(text);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await http.post("/users", {
        name,
        email,
        role,
        password: password || undefined, // optional → server may auto-generate
      });
      setResult({
        tempPassword: data?.tempPassword,
        userEmail: data?.user?.email ?? email,
      });
      onCreated?.(data);
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
      <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-white dark:bg-slate-900 shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Add User (Staff)</h2>
          <button
            onClick={handleClose}
            className="px-2 py-1 rounded-lg border hover:bg-accent"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!result && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm">Full name</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 bg-background"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Priya Sharma"
              />
            </div>

            <div>
              <label className="text-sm">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border px-3 py-2 bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="text-sm">Role</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 bg-background"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleEnum)}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="RECEPTIONIST">RECEPTIONIST</option>
                <option value="CASHIER">CASHIER</option>
                <option value="WAITER">WAITER</option>
                <option value="HOUSEKEEPING">HOUSEKEEPING</option>
              </select>
            </div>

            <div>
              <label className="text-sm">
                Password <span className="opacity-60">(optional)</span>
              </label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 bg-background"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to auto-generate"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-2 rounded-lg border hover:bg-accent"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-2 rounded-lg border hover:bg-accent"
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        )}

        {/* Success state */}
        {result && (
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <div className="text-sm">User created:</div>
              <div className="font-medium">{result.userEmail}</div>
            </div>
            {result.tempPassword ? (
              <div className="rounded-lg border p-3">
                <div className="text-sm mb-1">Temporary password:</div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 rounded bg-black/10 dark:bg-white/10">
                    {result.tempPassword}
                  </code>
                  <button
                    onClick={() => copy(result.tempPassword!)}
                    className="px-2 py-1 rounded border hover:bg-accent"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs opacity-70 mt-2">
                  Ask the user to login and change their password.
                </p>
              </div>
            ) : (
              <div className="text-sm">
                No temp password (you provided one). The user can login now.
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={handleClose} className="px-3 py-2 rounded-lg border hover:bg-accent">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
