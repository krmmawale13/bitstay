import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLE_PERMISSIONS, type PermissionKey } from './permissions.constants';

type OverrideJson = { add?: PermissionKey[]; remove?: PermissionKey[] };

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  // dynamic: UserTenant ho to waha se role, warna single-tenant User se
  async resolveForUser(userId: number, tenantId: number): Promise<PermissionKey[]> {
    let role: any = null;

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

    const base = new Set<PermissionKey>(ROLE_PERMISSIONS[role] ?? []);

    const key = `acl:user:${tenantId}:${userId}`;
    const meta = await (this.prisma as any).metadata.findFirst({
      where: { key },
      select: { value: true },
    });
    if (meta?.value) {
      const ov = meta.value as OverrideJson;
      (ov.add ?? []).forEach((p) => base.add(p));
      (ov.remove ?? []).forEach((p) => base.delete(p));
    }

    return Array.from(base);
  }
}
