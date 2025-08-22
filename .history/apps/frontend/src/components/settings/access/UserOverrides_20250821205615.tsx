import { useEffect, useMemo, useState } from "react";
import http from "@/lib/http";
import type { PermissionKey } from "@/lib/acl";

type UserLite = { id: number; name: string; email: string; role?: string };
type Overrides = { add: PermissionKey[]; remove: PermissionKey[] };

const ALL_PERMS: PermissionKey[] = [
  "dashboard.view",
  "customers.read","customers.write",
  "inventory.read","inventory.manage",
  "bars.read","bars.manage",
  "hotels.read","hotels.manage",
  "pos.use",
  "reports.view","reports.manage",
  "suppliers.read","suppliers.manage",
  "bookings.read","bookings.manage",
  "invoices.read","invoices.manage",
];

const INITIAL_OVERRIDES: Overrides = { add: [], remove: [] };

export default function UserOverrides() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selected, setSelected] = useState<UserLite | null>(null);
  const [ov, setOv] = useState<Overrides>(INITIAL_OVERRIDES);
  const [loadingOv, setLoadingOv] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await http.get<any[]>("/users").catch(() => ({ data: [] as any[] }));
      const list = Array.isArray(data) ? data : [];
      const mapped: UserLite[] = list.map((row: any) => ({
        id: row.user?.id ?? row.id,
        name: row.user?.name ?? row.name ?? "User",
        email: row.user?.email ?? row.email ?? "-",
        role: row.role ?? row.user?.role,
      }));
      setUsers(mapped);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.role ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const loadOverrides = async (u: UserLite) => {
    setSelected(u);
    setLoadingOv(true);
    try {
      const { data } = await http.get<Overrides>(`/settings/access/users/${u.id}/overrides`);
      setOv({
        add: Array.isArray(data?.add) ? data.add : [],
        remove: Array.isArray(data?.remove) ? data.remove : [],
      });
    } finally {
      setLoadingOv(false);
    }
  };

  const toggle = (perm: PermissionKey, list: "add" | "remove") => {
    setOv((prev) => {
      const next: Overrides = { add: [...prev.add], remove: [...prev.remove] };
      const arr = list === "add" ? next.add : next.remove;
      const idx = arr.indexOf(perm);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(perm);
      return next;
    });
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await http.put(`/settings/access/users/${selected.id}/overrides`, ov);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Left: users list */}
      <aside className="w-80 shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name/email/role…"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 mb-3 focus:ring-2 focus:ring-indigo-500"
        />
        <div className="max-h-[65vh] overflow-auto space-y-1">
          {loadingUsers && <div className="p-2 text-sm">Loading users…</div>}
          {!loadingUsers && filtered.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground">No users found.</div>
          )}
          {!loadingUsers &&
            filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => loadOverrides(u)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  selected?.id === u.id
                    ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                }`}
              >
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
                {u.role && <div className="text-[10px] uppercase mt-1 opacity-80">{u.role}</div>}
              </button>
            ))}
        </div>
      </aside>

      {/* Right: overrides editor */}
      <main className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-4">
        {!selected ? (
          <div className="text-sm text-muted-foreground">Select a user to view and edit overrides.</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{selected.name}</div>
                <div className="text-xs text-muted-foreground">{selected.email}</div>
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>

            <Section title="Grant (Add)">
              <PermGrid list={ALL_PERMS} active={ov.add} onToggle={(p) => toggle(p, "add")} />
            </Section>

            <Section title="Revoke (Remove)">
              <PermGrid list={ALL_PERMS} active={ov.remove} onToggle={(p) => toggle(p, "remove")} />
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="font-medium mb-2">{title}</div>
      {children}
    </section>
  );
}

function PermGrid({
  list,
  active,
  onToggle,
}: {
  list: PermissionKey[];
  active: PermissionKey[];
  onToggle: (perm: PermissionKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {list.map((p) => {
        const isActive = active.includes(p);
        return (
          <button
            key={p}
            onClick={() => onToggle(p)}
            className={`text-left px-3 py-2 rounded-lg border transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
              isActive ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800" : "border-slate-300 dark:border-slate-700"
            }`}
            title={p}
          >
            <div className="text-sm">{p}</div>
          </button>
        );
      })}
    </div>
  );
}
