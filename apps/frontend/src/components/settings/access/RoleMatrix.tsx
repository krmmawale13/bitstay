import React from "react";

type PermissionKey = string;

// ✅ Single source of truth for roles (schema-aligned)
const ROLES = ["ADMIN","MANAGER","RECEPTIONIST","CASHIER","WAITER","HOUSEKEEPING"] as const;
type Role = typeof ROLES[number];

export default function RoleMatrix({
  roles,
  allPermissions, // (kept for API compatibility; not needed for rendering)
  rolePermissions,
  editable = false, // not used in read-only view; reserved for future
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
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Permissions</th>
            </tr>
          </thead>
          <tbody>
            {safeRoles.map((r) => (
              <tr key={r} className="border-t border-slate-200 dark:border-slate-800">
                <td className="p-3 font-medium">{r}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {(rolePermissions[r] || []).map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium
                                   bg-indigo-50 text-indigo-700 border border-indigo-200
                                   dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700"
                        title={p}
                      >
                        {p}
                      </span>
                    ))}
                    {/* If a role has no permissions (unlikely), show a subtle hint */}
                    {(rolePermissions[r]?.length ?? 0) === 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">No permissions</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* editable reserved; no UI in read-only mode */}
      {editable ? null : null}
    </div>
  );
}
