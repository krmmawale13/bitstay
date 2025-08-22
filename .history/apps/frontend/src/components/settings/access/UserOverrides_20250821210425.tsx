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

function sortUnique(arr: PermissionKey[]) {
  return Array.from(new Set(arr)).sort();
}

export default function UserOverrides() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  const [selected, setSelected] = useState<UserLite | null>(null);
  const [ov, setOv] = useState<Overrides>(INITIAL_OVERRIDES);
  const [original, setOriginal] = useState<Overrides>(INITIAL_OVERRIDES);
  const [loadingOv, setLoadingOv] = useState(false);
  const [errorOv, setErrorOv] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const { data } = await http.get<UserLite[]>("/users");
      // data is normalized by backend fix
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErrorUsers(
        e?.response?.data?.message || e?.message || "Failed to load users."
      );
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => {
    if (!debounced) return users;
    return users.filter((u) =>
      (u.name || "").toLowerCase().includes(debounced) ||
      (u.email || "").toLowerCase().includes(debounced) ||
      ((u.role || "").toLowerCase().includes(debounced))
    );
  }, [users, debounced]);

  const loadOverrides = async (u: UserLite) => {
    setSelected(u);
    setLoadingOv(true);
    setErrorOv(null);
    try {
      const { data } = await http.get<Overrides>(`/settings/access/users/${u.id}/overrides`);
      const safe: Overrides = {
        add: sortUnique(Array.isArray(data?.add) ? data.add : []),
        remove: sortUnique(Array.isArray(data?.remove) ? data.remove : []),
      };
      setOv(safe);
      setOriginal(safe);
    } catch (e: any) {
      setErrorOv(
        e?.response?.data?.message || e?.message || "Failed to load overrides."
      );
      setOv(INITIAL_OVERRIDES);
      setOriginal(INITIAL_OVERRIDES);
    } finally {
      setLoadingOv(false);
    }
  };

  const toggle = (perm: PermissionKey, list: "add" | "remove") => {
    setOv((prev) => {
      const next: Overrides = {
        add: [...prev.add],
        remove: [...prev.remove],
      };
      const arr = list === "add" ? next.add : next.remove;
      const other = list === "add" ? next.remove : next.add;

      // if permission is in other list, remove it (mutually exclusive for sanity)
      const idxOther = other.indexOf(perm);
      if (idxOther >= 0) other.splice(idxOther, 1);

      const idx = arr.indexOf(perm);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(perm);

      next.add = sortUnique(next.add);
      next.remove = sortUnique(next.remove);
      return next;
    });
  };

  const isDirty = useMemo(() => {
    const a = JSON.stringify(ov);
    const b = JSON.stringify(original);
    return a !== b;
  }, [ov, original]);

  const save = async () => {
    if (!selected || !isDirty) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await http.put(`/settings/access/users/${selected.id}/overrides`, ov);
      setOriginal(ov);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(null), 1200);
    } catch (e: any) {
      setSaveMsg(
        e?.response?.data?.message || e?.message || "Save failed."
      );
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

        {errorUsers && (
          <div className="mb-2 rounded-lg border border-red-200/60 dark:border-red-800/60 bg-red-50/70 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 text-xs">
            {errorUsers}
          </div>
        )}

        <div className="max-h-[65vh] overflow-auto space-y-1">
          {loadingUsers && (
            <div className="p-2 text-sm">Loading users…</div>
          )}
          {!loadingUsers && filtered.length === 0 && !errorUsers && (
            <div className="p-2 text-sm text-muted-foreground">No users found.</div>
          )}
          {!loadingUsers && filtered.map((u) => {
            const active = selected?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => loadOverrides(u)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  {u.role && (
                    <span className="ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium
                                     bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 uppercase">
                      {u.role}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
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
              <div className="flex items-center gap-2">
                {saveMsg && (
                  <span className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60">
                    {saveMsg}
                  </span>
                )}
                <button
                  onClick={save}
                  disabled={saving || !isDirty}
                  className="px-4 py-2 rounded-xl font-medium text-white shadow-sm 
                             bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500
                             disabled:opacity-50"
                  title={!isDirty ? "No changes to save" : "Save overrides"}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            {errorOv && (
              <div className="rounded-lg border border-red-200/60 dark:border-red-800/60 bg-red-50/70 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-3 py-2 text-sm">
                {errorOv}
              </div>
            )}

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
              isActive
                ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800"
                : "border-slate-300 dark:border-slate-700"
            }`}
            title={p}
          >
            <div className="text-sm">{p}</div>
            {isActive && <div className="text-[10px] opacity-70">selected</div>}
          </button>
        );
      })}
    </div>
  );
}
