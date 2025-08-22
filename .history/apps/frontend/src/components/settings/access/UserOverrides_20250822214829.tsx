import { useEffect, useMemo, useState, useCallback } from "react";
import http from "@/lib/http";
import type { PermissionKey } from "@/lib/acl";
import { PERMISSIONS_META, PERMISSION_GROUPS_IN_ORDER } from "@/lib/permissions.meta";
import PermGroup from "@/components/settings/access/PermGroup";
import StickySaveBar from "@/components/settings/access/StickySaveBar";

type UserLite = { id: number; name: string; email: string; role?: string };
type Overrides = { add: PermissionKey[]; remove: PermissionKey[] };

type Props = {
  /** Called after a successful save, with the edited user's id (useful to refresh self perms) */
  onAfterSaveSelf?: (editedUserId: number) => void | Promise<void>;
};

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
  // include strict key used to gate Access Control
  "settings.access.manage",
];

const INITIAL_OVERRIDES: Overrides = { add: [], remove: [] };

const sortUnique = (arr: PermissionKey[]) => Array.from(new Set(arr)).sort();

function getTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");
}

/** 🔐 Base role → default permissions (mirror backend) */
const ROLE_PERMISSIONS_BASE: Record<string, PermissionKey[]> = {
  ADMIN: [...ALL_PERMS], // ADMIN gets everything including settings.access.manage
  MANAGER: [
    "dashboard.view","customers.read","customers.write",
    "inventory.read","inventory.manage",
    "bars.read","bars.manage",
    "hotels.read","hotels.manage",
    "pos.use",
    "reports.view","reports.manage",
    "suppliers.read","suppliers.manage",
    "bookings.read","bookings.manage",
    "invoices.read","invoices.manage",
  ],
  RECEPTIONIST: [
    "dashboard.view",
    "customers.read","customers.write",
    "bookings.read","bookings.manage",
    "invoices.read","invoices.manage",
  ],
  CASHIER: ["dashboard.view","pos.use","invoices.read","invoices.manage","reports.view"],
  WAITER: ["dashboard.view","customers.read","pos.use"],
  HOUSEKEEPING: ["dashboard.view","hotels.read"],
};

export default function UserOverrides({ onAfterSaveSelf }: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // Role filter for left list
  const [roleFilter, setRoleFilter] = useState<string>("");

  // tenant tracking to avoid race with Topbar
  const [tenantId, setTenantId] = useState<string | null>(null);

  const [users, setUsers] = useState<UserLite[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  const [selected, setSelected] = useState<UserLite | null>(null);
  const [ov, setOv] = useState<Overrides>(INITIAL_OVERRIDES);
  const [original, setOriginal] = useState<Overrides>(INITIAL_OVERRIDES);
  const [loadingOv, setLoadingOv] = useState(false);
  const [errorOv, setErrorOv] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Seed tenant + subscribe to storage changes (Topbar sets activeTenantId)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seed = getTenantId();
    if (seed !== tenantId) setTenantId(seed);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "activeTenantId" || e.key === "tenantId") {
        const t = getTenantId();
        setTenantId(t);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch users (runs when tenantId becomes available/changes)
  const fetchUsers = useCallback(async (tid?: string | null) => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const t = tid != null ? tid : tenantId;
      if (!t) {
        setUsers([]);
        setErrorUsers("Select a tenant first (login/topbar).");
        return;
      }
      // NOTE: interceptor injects x-tenant-id and bearer
      const { data } = await http.get<UserLite[]>("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setUsers([]);
      const msg = e?.response?.data?.message || e?.message || "Failed to load users.";
      setErrorUsers(msg);
      window.__toast?.push?.({ type: "error", message: "Couldn’t load users", description: msg });
    } finally {
      setLoadingUsers(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) fetchUsers(tenantId);
  }, [tenantId, fetchUsers]);

  const rolesInData = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => u.role && set.add(u.role));
    return Array.from(set).sort();
  }, [users]);

  const filtered = useMemo(() => {
    const base = users;
    const byText = !debounced
      ? base
      : base.filter((u) =>
          (u.name || "").toLowerCase().includes(debounced) ||
          (u.email || "").toLowerCase().includes(debounced) ||
          ((u.role || "").toLowerCase().includes(debounced))
        );
    const byRole = roleFilter ? byText.filter(u => (u.role || "") === roleFilter) : byText;
    return byRole;
  }, [users, debounced, roleFilter]);

  const loadOverrides = async (u: UserLite) => {
    setSelected(u);
    setLoadingOv(true);
    setErrorOv(null);
    try {
      const t = tenantId || getTenantId();
      if (!t) throw new Error("Select a tenant first (login/topbar).");

      // NOTE: interceptor injects x-tenant-id and bearer
      const { data } = await http.get<Overrides>(`/settings/access/users/${u.id}/overrides`);

      const safe: Overrides = {
        add: sortUnique(Array.isArray(data?.add) ? data.add : []),
        remove: sortUnique(Array.isArray(data?.remove) ? data.remove : []),
      };
      setOv(safe);
      setOriginal(safe);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load overrides.";
      setErrorOv(msg);
      setOv(INITIAL_OVERRIDES);
      setOriginal(INITIAL_OVERRIDES);
      window.__toast?.push?.({ type: "error", message: "Couldn’t load overrides", description: msg });
    } finally {
      setLoadingOv(false);
    }
  };

  /** Does the selected user's base role include this permission? */
  const baseHas = useCallback(
    (perm: PermissionKey) => {
      const role = (selected?.role || "").toUpperCase();
      const base = ROLE_PERMISSIONS_BASE[role];
      if (!base) return false;
      return base.includes(perm);
    },
    [selected?.role]
  );

  /** Base-aware toggle:
   * - If base HAS perm → first click = put in remove (Revoke). Click again = clear.
   * - If base LACKS perm → first click = put in add (Grant). Click again = clear.
   * Mutual exclusivity between add/remove is preserved.
   */
  const toggle = (perm: PermissionKey) => {
    setOv((prev) => {
      const next: Overrides = { add: [...prev.add], remove: [...prev.remove] };
      const inAdd = next.add.includes(perm);
      const inRemove = next.remove.includes(perm);
      const base = baseHas(perm);

      // Neutral → choose target based on base
      if (!inAdd && !inRemove) {
        if (base) next.remove = sortUnique([...next.remove, perm]); // revoke
        else next.add = sortUnique([...next.add, perm]);           // grant
        return next;
      }

      // Already in add/remove → clicking again clears it (back to neutral)
      if (inAdd) next.add = next.add.filter(p => p !== perm);
      if (inRemove) next.remove = next.remove.filter(p => p !== perm);
      return next;
    });
  };

  const isDirty = useMemo(
    () => JSON.stringify(ov) !== JSON.stringify(original),
    [ov, original]
  );

  const save = async () => {
    if (!selected || !isDirty) return;
    setSaving(true);
    try {
      const t = tenantId || getTenantId();
      if (!t) throw new Error("Select a tenant first (login/topbar).");

      // NOTE: interceptor injects x-tenant-id and bearer
      await http.put(`/settings/access/users/${selected.id}/overrides`, ov);
      setOriginal(ov);
      window.__toast?.push?.({
        type: "success",
        message: "Overrides saved.",
        description:
          ov.add.length || ov.remove.length
            ? `Grant: +${ov.add.length} • Revoke: −${ov.remove.length}`
            : "No exceptions (using base role)",
      });

      // 🔔 Notify parent so it can refresh permissions if editing self
      if (onAfterSaveSelf) await onAfterSaveSelf(selected.id);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Save failed.";
      window.__toast?.push?.({ type: "error", message: "Save failed", description: msg });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setOv(INITIAL_OVERRIDES);
  };

  // Group permissions by business area with labels
  const groupedPerms = useMemo<Array<[string, PermissionKey[]]>>(() => {
    const groups: Record<string, PermissionKey[]> = {};
    for (const key of ALL_PERMS) {
      const meta = PERMISSIONS_META[key] || { group: "Other", label: key };
      const g = meta.group || "Other";
      (groups[g] ||= []).push(key);
    }

    const orderedEntries: Array<[string, PermissionKey[]]> = [];

    // 1) Known groups in defined order
    PERMISSION_GROUPS_IN_ORDER.forEach((g) => {
      const list = groups[g];
      if (list && list.length) orderedEntries.push([g, list]);
    });

    // 2) Any leftover/unknown groups appended at the end
    Object.keys(groups).forEach((g) => {
      if (!PERMISSION_GROUPS_IN_ORDER.includes(g) && groups[g]?.length) {
        orderedEntries.push([g, groups[g]!]);
      }
    });

    return orderedEntries;
  }, []);

  const exceptionsSummary = useMemo(() => {
    const plus = ov.add.length;
    const minus = ov.remove.length;
    return { plus, minus, text: `Exceptions: +${plus} / −${minus}` };
  }, [ov]);

  return (
    <div className="flex gap-6">
      {/* Left: users list */}
      <aside className="w-80 shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name/email/role…"
            className="flex-1 h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/40 px-3 focus:ring-2 focus:ring-indigo-500"
          />
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 min-w-[140px] appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/40 pl-3 pr-8 text-sm focus:ring-2 focus:ring-indigo-500"
              title="Filter by role"
            >
              <option value="">All</option>
              {rolesInData.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {/* chevron to normalize native select look */}
            <svg
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
              viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.25 7.5L10 12.25L14.75 7.5H5.25Z" />
            </svg>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mb-2">
          {users.length} users{debounced || roleFilter ? ` • ${filtered.length} filtered` : ""}
        </div>

        {errorUsers && (
          <div className="mb-2 rounded-lg border border-red-200/60 dark:border-red-800/60 bg-red-50/70 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 text-xs">
            {errorUsers}
          </div>
        )}

        <div className="max-h-[65vh] overflow-auto space-y-1">
          {loadingUsers && <div className="p-2 text-sm">Loading users…</div>}
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
                    ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-200/60"
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
                                     bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 uppercase tracking-wide">
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
      <main className="relative flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-4">
        {!selected ? (
          <div className="text-sm text-muted-foreground">
            {errorUsers ? "Fix tenant selection to proceed." : "Select a user to view and edit exceptions to their base role."}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{selected.name}</div>
                <div className="text-xs text-muted-foreground">{selected.email}</div>
                <div className="mt-1 text-xs">
                  <span className="opacity-70">Base role:</span>{" "}
                  <span className="font-medium">{selected.role || "N/A"}</span>{" "}
                  <span className="opacity-40">•</span>{" "}
                  <span className="opacity-70">{exceptionsSummary.text}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetToDefaults}
                  className="px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98]"
                  title="Reset overrides to match the base role"
                  disabled={!isDirty && ov.add.length === 0 && ov.remove.length === 0}
                >
                  Reset to role defaults
                </button>
              </div>
            </div>

            {errorOv && (
              <div className="rounded-lg border border-red-200/60 dark:border-red-800/60 bg-red-50/70 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-3 py-2 text-sm">
                {errorOv}
              </div>
            )}

            {/* Permission groups */}
            <div className="space-y-4">
              {groupedPerms.map(([groupName, keys]) => (
                <PermGroup key={groupName} title={groupName}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {keys.map((p) => {
                      const isAdd = ov.add.includes(p);
                      const isRemove = ov.remove.includes(p);
                      const meta = PERMISSIONS_META[p] || { label: p, description: "" };
                      const active = isAdd || isRemove;

                      // How will a neutral click behave? (helps button styling)
                      const willRevokeIfNeutral = baseHas(p);
                      const actionLabel = isAdd ? "Grant" : isRemove ? "Revoke" : willRevokeIfNeutral ? "Revoke" : "Grant";

                      return (
                        <button
                          key={p}
                          onClick={() => toggle(p)}
                          className={[
                            "text-left px-3 py-2 rounded-lg border transition group",
                            "hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.99]",
                            active
                              ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800"
                              : "border-slate-300 dark:border-slate-700",
                            !active && willRevokeIfNeutral ? "ring-1 ring-red-200/60 dark:ring-red-900/30" : "",
                          ].join(" ")}
                          title={p}
                        >
                          <div className="text-sm font-medium">{meta.label || p}</div>
                          {meta.description ? (
                            <div className="text-[11px] opacity-70">{meta.description}</div>
                          ) : null}
                          <div className="mt-1 flex items-center gap-2">
                            <code className="text-[10px] opacity-60">{p}</code>
                            <span
                              className={[
                                "text-[10px] px-1.5 py-0.5 rounded-md border",
                                isRemove
                                  ? "border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-900/30"
                                  : isAdd
                                  ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/30"
                                  : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40",
                              ].join(" ")}
                            >
                              {actionLabel}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </PermGroup>
              ))}
            </div>

            {/* Sticky save bar */}
            <StickySaveBar
              dirty={isDirty}
              saving={saving}
              onSave={save}
              labelDirty="You have unsaved changes"
              labelSaved="All changes saved"
            />
          </div>
        )}
      </main>
    </div>
  );
}
