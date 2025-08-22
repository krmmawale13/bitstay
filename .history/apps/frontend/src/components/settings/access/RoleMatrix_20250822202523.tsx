import React from "react";
import type { PermissionKey } from "@/lib/acl";
import { PERMISSIONS_META, PERMISSION_GROUPS_IN_ORDER } from "@/lib/permissions.meta";

// ✅ Single source of truth for roles (schema-aligned)
const ROLES = ["ADMIN","MANAGER","RECEPTIONIST","CASHIER","WAITER","HOUSEKEEPING"] as const;
type Role = typeof ROLES[number];

export default function RoleMatrix({
  roles,
  allPermissions, // (kept for API compatibility; not needed directly)
  rolePermissions,
  editable = false, // read-only view; reserved for future
}: {
  roles: Role[];
  allPermissions: PermissionKey[];
  rolePermissions: Record<Role, PermissionKey[]>;
  editable?: boolean;
}) {
  // Ensure incoming roles are valid & ordered like schema
  const safeRoles: Role[] = ROLES.filter((r) => (roles as string[]).includes(r)) as Role[];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-4 space-y-4">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Role → permissions mapping (read-only). Use user overrides for exceptions.
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 dark:bg-slate-800/60">
            <tr>
              <th className="text-left p-3 w-40">Role</th>
              <th className="text-left p-3">Permissions</th>
            </tr>
          </thead>
          <tbody>
            {safeRoles.map((r) => {
              const perms = (rolePermissions[r] || []) as PermissionKey[];

              // Group this role's permissions by business area using meta
              const groups: Record<string, PermissionKey[]> = {};
              for (const key of perms) {
                const meta = PERMISSIONS_META[key] || { group: "Other", label: key };
                const g = meta.group || "Other";
                (groups[g] ||= []).push(key);
              }

              // Stable order: known groups first, then any leftovers
              const ordered: Array<[string, PermissionKey[]]> = [];
              PERMISSION_GROUPS_IN_ORDER.forEach((g) => {
                const list = groups[g];
                if (list && list.length) ordered.push([g, list]);
              });
              Object.keys(groups).forEach((g) => {
                if (!PERMISSION_GROUPS_IN_ORDER.includes(g) && groups[g]?.length) {
                  ordered.push([g, groups[g]!]);
                }
              });

              return (
                <tr key={r} className="border-t border-slate-200 dark:border-slate-800 align-top">
                  <td className="p-3 font-medium">{r}</td>
                  <td className="p-3">
                    {ordered.length === 0 ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">No permissions</span>
                    ) : (
                      <div className="space-y-2">
                        {ordered.map(([groupName, keys]) => (
                          <div key={groupName}>
                            <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              {groupName}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {keys.map((p) => {
                                const meta = PERMISSIONS_META[p] || { label: p, description: "" };
                                return (
                                  <span
                                    key={p}
                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium
                                               bg-indigo-50 text-indigo-700 border border-indigo-200
                                               dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700"
                                    title={p}
                                  >
                                    {meta.label || p}
                                    <code className="text-[10px] opacity-60">({p})</code>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* editable reserved; no UI in read-only mode */}
      {editable ? null : null}
    </div>
  );
}
