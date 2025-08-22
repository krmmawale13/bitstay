// apps/frontend/src/pages/settings/access/index.tsx
import { useEffect, useMemo, useState } from "react";
import http from "@/lib/http";
import type { PermissionKey } from "@/lib/acl";

type UserLite = { id: number; name: string; email: string; role?: string };
type OverrideDto = { add?: PermissionKey[]; remove?: PermissionKey[] };

const ALL_PERMS: PermissionKey[] = [
  "dashboard.view",
  "customers.read", "customers.write",
  "inventory.read", "inventory.manage",
  "bars.read", "bars.manage",
  "hotels.read", "hotels.manage",
  "pos.use",
  "reports.view", "reports.manage",
  "suppliers.read", "suppliers.manage",
  "bookings.read", "bookings.manage",
  "invoices.read", "invoices.manage",
];

// ✅ explicit typed initial value so TS doesn't infer {}
const INITIAL_OVERRIDES: OverrideDto = { add: [], remove: [] };

export default function AccessControlPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [selected, setSelected] = useState<UserLite | null>(null);
  const [ov, setOv] = useState<OverrideDto>(INITIAL_OVERRIDES); // ✅ typed
  const [loadingOv, setLoadingOv] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- load users (tenant-scoped)
  useEffect(() => {
    (async () => {
      setLoadingUsers(true);
      try {
        // Recommended backend shape: [{ user:{id,name,email,isActive}, role }]
        const { data } = await http.get("/users").catch(() => ({ data: [] as any[] }));
        const mapped: UserLite[] = Array.isArray(data)
          ? data.map((row: any) => ({
              id: row.user?.id ?? row.id,
              name: row.user?.name ?? row.name ?? "User",
              email: row.user?.email ?? row.email ?? "-",
              role: row.role ?? row.user?.role,
            }))
          : [];
        setUsers(mapped);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

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

  // --- load overrides for a selected user
  const loadOverrides = async (u: UserLite) => {
    setSelected(u);
    setLoadingOv(true);
    try {
      const { data } = await http.get(`/settings/access/users/${u.id}/overrides`);
      setOv({
        add: Array.isArray(data?.add) ? (data.add as PermissionKey[]) : [],
        remove: Array.isArray(data?.remove) ? (data.remove as PermissionKey[]) : [],
      });
    } finally {
      setLoadingOv(false);
    }
  };

  // --- toggle helpers
  const toggle = (perm: PermissionKey, list: "add" | "remove") => {
    setOv((prev) => {
      const next: OverrideDto = {
        add: [...(prev.add ?? [])],
        remove: [...(prev.remove ?? [])],
      };
      const arr = (list === "add" ? next.add! : next.remove!) as PermissionKey[];
      const idx = arr.indexOf(perm);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(perm);
      return next;
    });
  };

  // --- save overrides
  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await http.put(`/settings/access/users/${selected.id}/overrides`, {
        add: ov.add ?? [],
        remove: ov.remove ?? [],
      } as OverrideDto);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Access Control</h1>
          <p className="text-sm text-muted-foreground">
            Grant or revoke permissions for individual users (tenant-scoped).
          </p>
        </div>
        <button
          onClick={save}
          disabled={!selected || saving}
          className="px-4 py-2 rounded-lg border hover:bg-accent disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </header>

      <div className="flex gap-6">
        {/* Left: users list */}
        <aside className="w-80 shrink-0 border rounded-xl p-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name/email/role…"
            className="w-full border rounded-lg px-3 py-2 mb-3 bg-background"
          />
          <div className="max-h-[65vh] overflow-auto">
            {loadingUsers && <div className="p-2 text-sm">Loading users…</div>}
            {!loadingUsers && filtered.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">No users found.</div>
            )}
            {!loadingUsers &&
              filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => loadOverrides(u)}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-accent ${
                    selected?.id === u.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                  {u.role && (
                    <div className="text-[10px] uppercase mt-1 opacity-80">{u.role}</div>
                  )}
                </button>
              ))}
          </div>
        </aside>

        {/* Right: overrides editor */}
        <main className="flex-1 border rounded-xl p-4">
          {!selected && (
            <div className="text-sm text-muted-foreground">
              Select a user to view and edit overrides.
            </div>
          )}
          {selected && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{selected.name}</div>
                  <div className="text-xs text-muted-foreground">{selected.email}</div>
                </div>
                {loadingOv && <div className="text-sm">Loading overrides…</div>}
              </div>

              <Section title="Grant (Add)">
                <PermGrid
                  list={ov.add ?? []}
                  onToggle={(p) => toggle(p, "add")}
                />
              </Section>

              <Section title="Revoke (Remove)">
                <PermGrid
                  list={ov.remove ?? []}
                  onToggle={(p) => toggle(p, "remove")}
                />
              </Section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------- small local components ---------- */

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
  onToggle,
}: {
  list: PermissionKey[];
  onToggle: (perm: PermissionKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {ALL_PERMS.map((p) => {
        const active = list.includes(p);
        return (
          <button
            key={p}
            onClick={() => onToggle(p)}
            className={`text-left px-3 py-2 rounded-lg border hover:bg-accent ${
              active ? "bg-accent" : ""
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
