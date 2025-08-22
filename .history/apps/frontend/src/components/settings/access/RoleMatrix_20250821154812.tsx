import { useMemo } from "react";

export type PermissionKey = string;
export type RoleEnum = "ADMIN" | "MANAGER" | "RECEPTIONIST" | "CASHIER" | "WAITER" | "HOUSEKEEPING";

type Props = {
  roles: RoleEnum[];                       // columns
  allPermissions: PermissionKey[];         // rows
  rolePermissions: Record<RoleEnum, PermissionKey[]>; // backend map mirror (optional/local)
  onToggle?: (role: RoleEnum, perm: PermissionKey, next: boolean) => void; // optional edit handler
  editable?: boolean;                      // default false
};

export default function RoleMatrix({
  roles,
  allPermissions,
  rolePermissions,
  onToggle,
  editable = false,
}: Props) {
  const grid = useMemo(() => {
    const m: Record<RoleEnum, Set<PermissionKey>> = {} as any;
    roles.forEach(r => (m[r] = new Set(rolePermissions?.[r] ?? [])));
    return m;
  }, [roles, rolePermissions]);

  return (
    <div className="w-full overflow-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-accent/50 sticky top-0 z-10">
          <tr>
            <th className="text-left p-3 font-semibold w-[280px]">Permission</th>
            {roles.map((r) => (
              <th key={r} className="text-left p-3 font-semibold">{r}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allPermissions.map((perm) => (
            <tr key={perm} className="border-t">
              <td className="p-3 font-medium">{perm}</td>
              {roles.map((r) => {
                const active = grid[r]?.has(perm);
                return (
                  <td key={r} className="p-2">
                    {editable && onToggle ? (
                      <button
                        onClick={() => onToggle(r, perm, !active)}
                        className={`px-3 py-1 rounded-lg border hover:bg-accent ${active ? "bg-accent" : ""}`}
                        title={`${r}: ${perm}`}
                      >
                        {active ? "Allowed" : "—"}
                      </button>
                    ) : (
                      <span className={`inline-block px-2 py-1 rounded ${active ? "bg-accent" : "opacity-60"}`}>
                        {active ? "Allowed" : "—"}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
