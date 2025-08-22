import React from "react";

type PermissionKey = string;
type Role = "ADMIN"|"MANAGER"|"RECEPTIONIST"|"CASHIER"|"WAITER"|"HOUSEKEEPING";

export default function RoleMatrix({
  roles,
  allPermissions,
  rolePermissions,
  editable = false,
}: {
  roles: Role[];
  allPermissions: PermissionKey[];
  rolePermissions: Record<Role, PermissionKey[]>;
  editable?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-4">
        <div className="text-sm text-muted-foreground">
          Role &rarr; permissions mapping (read-only). Use user overrides for exceptions.
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 dark:bg-slate-800/60">
            <tr>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Permissions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r} className="border-t border-slate-200 dark:border-slate-800">
                <td className="p-3 font-medium">{r}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {(rolePermissions[r] || []).map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
