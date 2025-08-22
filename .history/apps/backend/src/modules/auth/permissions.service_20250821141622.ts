import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // relative path
import { ROLE_PERMISSIONS, type PermissionKey } from './permissions.constants';

type OverrideJson = { add?: PermissionKey[]; remove?: PermissionKey[] };

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolve effective permissions for a user in a tenant.
   * Schema-aligned: role is on User, and User belongs to a Tenant (no UserTenant join).
   */
  async resolveForUser(userId: number, tenantId: number): Promise<PermissionKey[]> {
    // 1) get user with role, ensure tenant match (single-tenant user model)
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenant: { id: tenantId } },
      select: { role: true },
    });
    if (!user) return [];

    // 2) base from role
    const base = new Set<PermissionKey>(ROLE_PERMISSIONS[user.role] ?? []);

    // 3) per-user overrides stored in Metadata (key is NOT unique → use findFirst)
    const key = `acl:user:${tenantId}:${userId}`;
    const meta = await (this.prisma as any).metadata.findFirst({
      where: { key },
      select: { value: true },
    });

    if (meta?.value) {
      const ov = meta.value as OverrideJson;
      (ov.add ?? []).forEach(p => base.add(p));
      (ov.remove ?? []).forEach(p => base.delete(p));
    }

    return Array.from(base);
  }
}
