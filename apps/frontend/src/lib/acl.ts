// apps/frontend/src/lib/acl.ts

// Permission helpers
export type PermissionKey = string;

// Normalize input to a Set for fast membership checks
export function toPermSet(perms?: PermissionKey[] | Set<PermissionKey> | null) {
  if (!perms) return new Set<PermissionKey>();
  return perms instanceof Set ? perms : new Set(perms);
}

/** EXACT match needed for a single permission */
export function can(
  perms: PermissionKey[] | Set<PermissionKey>,
  required: PermissionKey
) {
  return toPermSet(perms).has(required);
}

/** ANY of the required perms is enough (good for menu items) */
export function canAny(
  perms: PermissionKey[] | Set<PermissionKey>,
  required?: PermissionKey[] // ← made optional to align with menu items that may omit `required`
) {
  if (!required || required.length === 0) return true;
  const set = toPermSet(perms);
  for (const key of required) if (set.has(key)) return true;
  return false;
}

/** ALL required perms must be present (good for critical widgets) */
export function canAll(
  perms: PermissionKey[] | Set<PermissionKey>,
  required?: PermissionKey[] // ← optional for consistency
) {
  if (!required || required.length === 0) return true;
  const set = toPermSet(perms);
  for (const key of required) if (!set.has(key)) return false;
  return true;
}

/** Filter a list (ANY by default — ideal for menu items) */
export function filterByPerms<
  T extends { required?: PermissionKey[] | undefined }
>(items: T[], perms: PermissionKey[] | Set<PermissionKey>): T[] {
  return items.filter((it) => canAny(perms, it.required));
}
