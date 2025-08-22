import { useEffect, useMemo, useState } from "react";
import { getUserOverrides, setUserOverrides } from "@/services/access.service";
import type { OverrideDto } from "@/services/access.service";
import { PermissionKey } from "@/lib/acl";
import { http } from "@/lib/http"; // if you want direct calls; otherwise remove
import { RoleEnum } from "@/services/types";

type UserLite = { id: number; name: string; email: string; role?: RoleEnum };

export default function AccessControlPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserLite[]>([]);
  const [selected, setSelected] = useState<UserLite | null>(null);
  const [loading, setLoading] = useState(false);
  const [ov, setOv] = useState<OverrideDto>({ add: [], remove: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // TODO: replace with your /users list endpoint (tenant-scoped)
    // For now, expect backend provides /users (GET) returning list with {user:{id,email,name,isActive}, role, id}
    (async () => {
      try {
        setLoading(true);
        const { data } = await fetchUsers();
        const mapped: UserLite[] = data.map((ut: any) => ({
          id: ut.user.id,
          name: ut.user.name,
          email: ut.user.email,
          role: ut.role,
        }));
        setUsers(mapped);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, query]);

  const loadOverrides = async (u: UserLite) => {
    setSelected(u);
    const data = await getUserOverrides(u.id);
    setOv({ add: data.add ?? [], remove: data.remove ?? [] });
  };

  const onToggle = (perm: PermissionKey, list: "add" | "remove") => {
    setOv(prev => {
      const copy = { add: [...(prev.add ?? [])], remove: [...(prev.remove ?? [])] };
      const arr = copy[list]!;
      const idx = arr.indexOf(perm);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(perm);
      return copy;
    });
  };

  const onSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await setUserOverrides(selected.id, ov);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Access Control</h1>
        <span className="text-sm text-muted-foreground">Per-user permission overrides</span>
      </div>

      <div className="flex gap-6">
        {/* Users list */}
        <div className="w-80 shrink-0 border rounded-xl p-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full border rounded-lg px-3 py-2 mb-3 bg-background"
          />
          <div className="max-h-[60vh] overflow-auto">
            {loading && <div className="p-2 text-sm">Loading…</div>}
            {!loading && filtered.map(u => (
              <button
                key={u.id}
                onClick={() => loadOverrides(u)}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-accent ${selected?.id===u.id ? "bg-accent" : ""}`}
              >
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
                <div className="text-[10px] uppercase mt-1 opacity-80">{u.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Overrides editor */}
        <div className="flex-1 border rounded-xl p-4">
          {!selected && <div className="text-sm text-muted-foreground">Select a user to edit overrides.</div>}
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{selected.name}</div>
                  <div className="text-xs text-muted-foreground">{selected.email}</div>
                </div>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border hover:bg-accent disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              <PermGrid title="Grant (Add)" list={ov.add ?? []} onToggle={(p)=>onToggle(p,"add")} />
              <PermGrid title="Revoke (Remove)" list={ov.remove ?? []} onToggle={(p)=>onToggle(p,"remove")} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- helpers ----
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

function PermGrid({
  title, list, onToggle,
}: { title: string; list: string[]; onToggle: (p: string)=>void }) {
  return (
    <div>
      <div className="font-medium mb-2">{title}</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {ALL_PERMS.map(p => {
          const active = list.includes(p);
          return (
            <button
              key={p}
              onClick={() => onToggle(p)}
              className={`text-left px-3 py-2 rounded-lg border hover:bg-accent ${active ? "bg-accent" : ""}`}
              title={p}
            >
              <div className="text-sm">{p}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// mock fetch users (replace with your users GET API)
async function fetchUsers() {
  // expected server response: userTenants list; mapping done above
  // replace with: return http.get("/users");
  const res = await fetch("/api/mock-users.json");
  return res.json().catch(()=>({ data: [] as any[] }));
}
