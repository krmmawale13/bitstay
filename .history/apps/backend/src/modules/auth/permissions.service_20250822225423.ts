// apps/backend/src/modules/auth/permissions.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLE_PERMISSIONS, type PermissionKey } from './permissions.constants';

type OverrideJson = { add?: PermissionKey[]; remove?: PermissionKey[] };

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolve effective permissions for a user in a tenant:
   *   base(role) + add[] - remove[]
   * Overrides are stored in `metadata` scoped by the tenant's `metadataVersion` ("acl").
   */
  async resolveForUser(userId: number, tenantId: number): Promise<PermissionKey[]> {
    // 1) Resolve role (multi-tenant via UserTenant; fallback to single-tenant User)
    let role: string | null = null;

    const ut = await (this.prisma as any).userTenant?.findFirst?.({
      where: { userId, tenantId },
      select: { role: true },
    });
    if (ut?.role) role = ut.role;

    if (!role) {
      const single = await this.prisma.user.findFirst({
        where: { id: userId, tenantId },
        select: { role: true },
      });
      role = single?.role ?? null;
    }

    if (!role) return [];

    const roleKey = String(role).toUpperCase();
    const baseSet = new Set<PermissionKey>(ROLE_PERMISSIONS[roleKey as keyof typeof ROLE_PERMISSIONS] ?? []);

    // 2) Find (or at least read) the tenant-scoped ACL version row
    const ver = await (this.prisma as any).metadataVersion.findFirst({
      where: { tenantId, version: 'acl' },
      select: { id: true },
    });

    // 3) Load overrides for this user+tenant (scoped by versionId)
    const key = `acl:user:${tenantId}:${userId}`;
    let add: PermissionKey[] = [];
    let remove: PermissionKey[] = [];

    if (ver?.id) {
      const meta = await (this.prisma as any).metadata.findFirst({
        where: { key, versionId: ver.id },
        select: { value: true },
      });

      if (meta?.value) {
        // value may be a JSON string or already parsed object
        let ov: OverrideJson | null = null;
        try {
          ov = typeof meta.value === 'string' ? JSON.parse(meta.value) : (meta.value as OverrideJson);
        } catch {
          ov = null;
        }
        add = Array.isArray(ov?.add) ? (ov!.add as PermissionKey[]) : [];
        remove = Array.isArray(ov?.remove) ? (ov!.remove as PermissionKey[]) : [];
      }
    } else {
      // No version row yet → treat as no overrides
      add = [];
      remove = [];
    }

    // 4) Apply overrides
    for (const p of add) baseSet.add(p);
    for (const p of remove) baseSet.delete(p);

    // 5) Return stable, sorted list
    return Array.from(baseSet).sort();
  }
}
