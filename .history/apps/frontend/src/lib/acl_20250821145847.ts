// Permission helpers
export type PermissionKey = string;

export function toPermSet(perms?: PermissionKey[] | Set<PermissionKey> | null) {
  if (!perms) return new Set<PermissionKey>();
  return perms instanceof Set ? perms : new Set(perms);
}
export function can(perms: PermissionKey[] | Set<PermissionKey>, required: PermissionKey) {
  return toPermSet(perms).has(required);
}
export function canAny(perms: PermissionKey[] | Set<PermissionKey>, required: PermissionKey[]) {
  if (!required?.length) return true;
  const set = toPermSet(perms);
  for (const key of required) if (set.has(key)) return true;
  return false;
}
export function canAll(perms: PermissionKey[] | Set<PermissionKey>, required: PermissionKey[]) {
  if (!required?.length) return true;
  const set = toPermSet(perms);
  for (const key of required) if (!set.has(key)) return false;
  return true;
}
export function filterByPerms<T extends { required?: PermissionKey[] }>(
  items: T[],
  perms: PermissionKey[] | Set<PermissionKey>
): T[] {
  return items.filter((it) => canAny(perms, it.required ?? []));
}
