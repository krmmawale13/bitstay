import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { ROLE_PERMISSIONS, PermissionKey } from './permissions.constants';

/**
 * Overrides are stored in Metadata table as JSON:
 * key = `acl:user:${tenantId}:${userId}`
 * value = { add: PermissionKey[], remove: PermissionKey[] }
 */
type OverrideJson = { add?: PermissionKey[]; remove?: PermissionKey[] };

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async resolveForUser(userId: number, tenantId: number): Promise<PermissionKey[]> {
    // get role for this tenant
    const ut = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
      select: { role: true },
    });
    if (!ut) return [];

    // base from role
    const base = new Set<PermissionKey>(ROLE_PERMISSIONS[ut.role] ?? []);

    // read override from metadata
    const metaKey = `acl:user:${tenantId}:${userId}`;
    const meta = await this.prisma.metadata.findUnique({
      where: { key: metaKey },
      select: { value: true },
    });

    if (meta?.value) {
      const ov: OverrideJson = meta.value as any;
      (ov.add ?? []).forEach((p) => base.add(p));
      (ov.remove ?? []).forEach((p) => base.delete(p));
    }

    return Array.from(base);
  }
}
