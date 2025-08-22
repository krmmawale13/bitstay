import { useEffect, useMemo, useState } from "react";
import http from "@/lib/http";
import type { PermissionKey } from "@/lib/acl";
import RoleMatrix from "@/components/settings/access/RoleMatrix";
import AddUserModal from "@/components/settings/access/AddUserModal";

type UserLite = { id: number; name: string; email: string; role?: string };

// required (no optionals) → avoids TS '{}' inference
type Overrides = { add: PermissionKey[]; remove: PermissionKey[] };

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

const INITIAL_OVERRIDES: Overrides = { add: [], remove: [] };

export default function AccessControlPage() {
  const [tab, setTab] = useState<"users" | "roles">("users");

  // users + selection
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selected, setSelected] = useState<UserLite | null>(null);

  // overrides
  const [ov, setOv] = useState<Overrides>(INITIAL_OVERRIDES);
  const [loadingOv, setLoadingOv] = useState(false);
  const [saving, setSaving] = useState(false);

  // add user modal
  const [openAdd, setOpenAdd] = useState(false);

  // load users (tenant-scoped)
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
    setOv((prev: Overrides) => {
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
      await http.put(`/settings/access/users/${selected.id}/overrides`, {
        add: ov.add,
        remove: ov.remove,
      } as Overrides);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Access Control</h1>
          <p className="text-sm text-muted-foreground">Roles & per-user permissions overrides.</p>
        </div>

        {/* show Add only on Users tab */}
        {tab === "users" && (
          <button
            onClick={() => setOpenAdd(true)}
            className="px-4 py-2 rounded-lg border hover:bg-accent"
          >
            + Add User
          </button>
        )}
      </div>

      {/* tabs */}
      <div className="flex items-center gap-2 border-b">
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>Users</TabButton>
        <TabButton active={tab === "roles"} onClick={() => setTab("roles")}>Roles</TabButton>
      </div>

      {/* content */}
      {tab === "roles" ? (
        <div className="rounded-xl border p-4">
          <RoleMatrix
            roles={[
              "ADMIN",
              "MANAGER",
              "RECEPTIONIST",
              "CASHIER",
              "WAITER",
              "HOUSEKEEPING",
            ]}
            allPermissions={ALL_PERMS}
            rolePermissions={{
              ADMIN: ALL_PERMS,
              MANAGER: [
                "dashboard.view",
                "reports.view",
                "customers.read","customers.write",
                "inventory.read","inventory.manage",
                "bookings.read","bookings.manage",
                "invoices.read","invoices.manage",
              ],
              RECEPTIONIST: ["dashboard.view","bookings.read","bookings.manage","customers.read","invoices.read"],
              CASHIER: ["dashboard.view","pos.use","invoices.read","invoices.manage"],
              WAITER: ["dashboard.view","pos.use"],
              HOUSEKEEPING: ["dashboard.view","hotels.read"],
            }}
            editable={false}
          />
        </div>
      ) : (
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
                  <div className="flex items-center gap-2">
                    {loadingOv && <div className="text-sm">Loading overrides…</div>}
                    <button
                      onClick={save}
                      disabled={saving}
                      className="px-3 py-2 rounded-lg border hover:bg-accent disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
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
      )}

      {/* modal */}
      <AddUserModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onCreated={() => {
          setOpenAdd(false);
          fetchUsers(); // refresh list
        }}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 -mb-px border-b-2 ${
        active ? "border-foreground font-medium" : "border-transparent text-muted-foreground"
      }`}
    >
      {children}
    </button>
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
            className={`text-left px-3 py-2 rounded-lg border hover:bg-accent ${
              isActive ? "bg-accent" : ""
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
