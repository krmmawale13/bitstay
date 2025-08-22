export default function RoleMatrix({ roles, allPermissions, rolePermissions }: {
  roles: Role[];
  allPermissions: PermissionKey[];
  rolePermissions: Record<Role, PermissionKey[]>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 
                    bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-4 space-y-4">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Role → permissions mapping (read-only). Use overrides for exceptions.
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
            {roles.map(r => (
              <tr key={r} className="border-t border-slate-200 dark:border-slate-800">
                <td className="p-3 font-medium">{r}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {(rolePermissions[r] || []).map(p => (
                      <span key={p}
                        className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium
                                   bg-indigo-50 text-indigo-700 border border-indigo-200
                                   dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700">
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
