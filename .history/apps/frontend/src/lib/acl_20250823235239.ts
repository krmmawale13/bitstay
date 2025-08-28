// Permission helpers (checkpoint-aligned)
export type PermissionKey = string;

export type AclOptions = {
  /** ADMIN role bypasses all checks */
  isAdmin?: boolean;
  /** If permissions are empty/undefined (fresh session), treat as allowed (UI-preview safe) */
  allowWhenEmpty?: boolean;
};

export function toPermSet(perms?: PermissionKey[] | Set<PermissionKey> | null) {
  if (!perms) return new Set<PermissionKey>();
  return perms instanceof Set ? perms : new Set(perms);
}

/** EXACT match needed for a single permission */
export function can(
  perms: PermissionKey[] | Set<PermissionKey> | null | undefined,
  required: PermissionKey,
  opts: AclOptions = {}
) {
  if (opts.isAdmin) return true;
  const set = toPermSet(perms);
  if (set.size === 0 && opts.allowWhenEmpty) return true;
  return set.has(required);
}

/** ANY of the required perms is enough (good for menu items) */
export function canAny(
  perms: PermissionKey[] | Set<PermissionKey> | null | undefined,
  required: PermissionKey[] = [],
  opts: AclOptions = {}
) {
  if (opts.isAdmin) return true;
  if (!required.length) return true;
  const set = toPermSet(perms);
  if (set.size === 0 && opts.allowWhenEmpty) return true;
  for (const key of required) if (set.has(key)) return true;
  return false;
}

/** ALL required perms must be present (good for critical widgets) */
export function canAll(
  perms: PermissionKey[] | Set<PermissionKey> | null | undefined,
  required: PermissionKey[] = [],
  opts: AclOptions = {}
) {
  if (opts.isAdmin) return true;
  if (!required.length) return true;
  const set = toPermSet(perms);
  if (set.size === 0 && opts.allowWhenEmpty) return true;
  for (const key of required) if (!set.has(key)) return false;
  return true;
}

/** Filter a list (ANY by default — ideal for menu items) */
export function filterByPerms<T extends { required?: PermissionKey[] }>(
  items: T[],
  perms: PermissionKey[] | Set<PermissionKey> | null | undefined,
  opts: AclOptions = {}
): T[] {
  return items.filter((it) => canAny(perms, it.required ?? [], opts));
}
