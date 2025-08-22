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
  ADMIN: [...ALL_PERMS],
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
  const [roleFilter, setRoleFilter] = useState<string>("");
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

  const [showEffectiveOnly, setShowEffectiveOnly] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Seed tenant + subscribe to storage changes
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

  // Fetch users
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

  const baseHas = useCallback(
    (perm: PermissionKey) => {
      const role = (selected?.role || "").toUpperCase();
      const base = ROLE_PERMISSIONS_BASE[role];
      if (!base) return false;
      return base.includes(perm);
    },
    [selected?.role]
  );

  const effectiveHas = useCallback(
    (perm: PermissionKey) => {
      const base = baseHas(perm);
      if (ov.add.includes(perm)) return true;
      if (ov.remove.includes(perm)) return false;
      return base;
    },
    [baseHas, ov.add, ov.remove]
  );

  // Tri-state setter
  const setStateFor = (perm: PermissionKey, state: "grant" | "neutral" | "revoke") => {
    setOv(prev => {
      let add = prev.add.slice();
      let rem = prev.remove.slice();
      add = add.filter(p => p !== perm);
      rem = rem.filter(p => p !== perm);
      if (state === "grant") add.push(perm);
      if (state === "revoke") rem.push(perm);
      return { add: sortUnique(add), remove: sortUnique(rem) };
    });
  };

  const isDirty = useMemo(() => JSON.stringify(ov) !== JSON.stringify(original), [ov, original]);

  const save = async () => {
    if (!selected || !isDirty) return;
    setSaving(true);
    try {
      const t = tenantId || getTenantId();
      if (!t) throw new Error("Select a tenant first (login/topbar).");
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
      if (onAfterSaveSelf) await onAfterSaveSelf(selected.id);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Save failed.";
      window.__toast?.push?.({ type: "error", message: "Save failed", description: msg });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => setOv(INITIAL_OVERRIDES);

  // Group permissions with order
  const groupedPerms = useMemo<Array<[string, PermissionKey[]]>>(() => {
    const groups: Record<string, PermissionKey[]> = {};
    for (const key of ALL_PERMS) {
      const meta = PERMISSIONS_META[key] || { group: "Other", label: key };
      const g = meta.group || "Other";
      (groups[g] ||= []).push(key);
    }
    const ordered: Array<[string, PermissionKey[]]> = [];
    PERMISSION_GROUPS_IN_ORDER.forEach((g) => {
      const list = groups[g];
      if (list?.length) ordered.push([g, list]);
    });
    Object.keys(groups).forEach((g) => {
      if (!PERMISSION_GROUPS_IN_ORDER.includes(g) && groups[g]?.length) {
        ordered.push([g, groups[g]!]);
      }
    });
    return ordered;
  }, []);

  const exceptionsSummary = useMemo(() => {
    const plus = ov.add.length;
    const minus = ov.remove.length;
    return { plus, minus, text: `Exceptions: +${plus} / −${minus}` };
  }, [ov]);

  // Bulk helpers per group
  const bulkSet = (keys: PermissionKey[], state: "grant" | "neutral" | "revoke") => {
    setOv(prev => {
      let add = prev.add.slice();
      let rem = prev.remove.slice();
      // clear current group first
      add = add.filter(p => !keys.includes(p));
      rem = rem.filter(p => !keys.includes(p));
      if (state === "grant") add = sortUnique([...add, ...keys]);
      if (state === "revoke") rem = sortUnique([...rem, ...keys]);
      return { add, remove: rem };
    });
  };

  // Filters for “effective only”
  const shouldShow = (perm: PermissionKey) => {
    if (!showEffectiveOnly) return true;
    return effectiveHas(perm);
  };

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
            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
            {/* Header + toggles */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={showEffectiveOnly}
                    onChange={(e) => setShowEffectiveOnly(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700"
                  />
                  Show effective only
                </label>
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

            {/* Legend */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 px-3 py-2 text-xs flex flex-wrap items-center gap-3">
              <span className="font-medium">Legend:</span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded bg-emerald-400/70" /> Grant
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded bg-slate-300/80" /> Neutral
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded bg-rose-400/70" /> Revoke
              </span>
              <span className="mx-2 opacity-30">|</span>
              <span>Base: <span className="font-medium">✓/✗</span></span>
              <span>Effective: <span className="font-medium">✓/✗</span></span>
            </div>

            {errorOv && (
              <div className="rounded-lg border border-red-200/60 dark:border-red-800/60 bg-red-50/70 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-3 py-2 text-sm">
                {errorOv}
              </div>
            )}

            {/* Permission groups */}
            <div className="space-y-4">
              {groupedPerms.map(([groupName, keys]) => {
                const keysToShow = keys.filter(shouldShow);
                if (keysToShow.length === 0) return null;

                return (
                  <PermGroup key={groupName} title={
                    <div className="flex items-center justify-between">
                      <span>{groupName}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          className="text-[11px] px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-900/20"
                          onClick={() => bulkSet(keysToShow, "grant")}
                          title="Grant all in this group"
                        >
                          Grant all
                        </button>
                        <button
                          className="text-[11px] px-2 py-1 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40"
                          onClick={() => bulkSet(keysToShow, "neutral")}
                          title="Clear all overrides in this group"
                        >
                          Clear
                        </button>
                        <button
                          className="text-[11px] px-2 py-1 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-900/20"
                          onClick={() => bulkSet(keysToShow, "revoke")}
                          title="Revoke all in this group"
                        >
                          Revoke all
                        </button>
                      </div>
                    </div>
                  }>
                    <div className="space-y-2">
                      {keysToShow.map((p) => {
                        const meta = PERMISSIONS_META[p] || { label: p, description: "" };
                        const base = baseHas(p);
                        const eff = effectiveHas(p);
                        const state: "grant" | "neutral" | "revoke" =
                          ov.add.includes(p) ? "grant" : ov.remove.includes(p) ? "revoke" : "neutral";

                        return (
                          <div
                            key={p}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 bg-white/60 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-slate-900/60 transition"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{meta.label || p}</div>
                              {meta.description ? (
                                <div className="text-[11px] opacity-70 truncate">{meta.description}</div>
                              ) : null}
                              <div className="mt-1 flex items-center gap-2 text-[11px]">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
                                  Base: {base ? "✓" : "✗"}
                                </span>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
                                  Effective: {eff ? "✓" : "✗"}
                                </span>
                                {state !== "neutral" && (
                                  <span className={state === "grant"
                                    ? "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-900/30"
                                    : "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-rose-200 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-900/30"}>
                                    {state === "grant" ? "Grant" : "Revoke"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Segmented tri-state */}
                            <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
                              <button
                                onClick={() => setStateFor(p, "grant")}
                                className={[
                                  "px-2.5 py-1.5 text-[11px] font-medium",
                                  "hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
                                  state === "grant" ? "bg-emerald-100 dark:bg-emerald-900/30" : ""
                                ].join(" ")}
                                title="Grant (add)"
                              >
                                Grant
                              </button>
                              <button
                                onClick={() => setStateFor(p, "neutral")}
                                className={[
                                  "px-2.5 py-1.5 text-[11px] font-medium border-l border-slate-300 dark:border-slate-700",
                                  "hover:bg-slate-100 dark:hover:bg-slate-800/40",
                                  state === "neutral" ? "bg-slate-100 dark:bg-slate-800/50" : ""
                                ].join(" ")}
                                title="Neutral (no override)"
                              >
                                Neutral
                              </button>
                              <button
                                onClick={() => setStateFor(p, "revoke")}
                                className={[
                                  "px-2.5 py-1.5 text-[11px] font-medium border-l border-slate-300 dark:border-slate-700",
                                  "hover:bg-rose-50 dark:hover:bg-rose-900/20",
                                  state === "revoke" ? "bg-rose-100 dark:bg-rose-900/30" : ""
                                ].join(" ")}
                                title="Revoke (remove)"
                              >
                                Revoke
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </PermGroup>
                );
              })}
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
