import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLE_PERMISSIONS, type PermissionKey } from './permissions.constants';

type OverrideJson = { add?: PermissionKey[]; remove?: PermissionKey[] };

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async resolveForUser(userId: number, tenantId: number): Promise<PermissionKey[]> {
    // role per-tenant
    const ut = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
      select: { role: true },
    });
    if (!ut) return [];

    // base permissions from role
    const base = new Set<PermissionKey>(ROLE_PERMISSIONS[ut.role] ?? []);

    // per-user override from Metadata (JSON)
    const key = `acl:user:${tenantId}:${userId}`;
    const meta = await this.prisma.metadata.findUnique({
      where: { key },
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
