// apps/backend/src/modules/settings/access.controller.ts
import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsService } from '../auth/permissions.service';
// 🤝 Try to import enum if exists; fall back to string
import type { MetadataType } from '@prisma/client';

type OverrideDto = { add?: string[]; remove?: string[] };

@UseGuards(TenantGuard)
@Controller('settings/access')
export class AccessController {
  constructor(private prisma: PrismaService, private perms: PermissionsService) {}

  private key(tenantId: number, userId: number) {
    return `acl:user:${tenantId}:${userId}`;
  }

  // Small helper: pick correct `type` value for Metadata
  private resolveMetadataType(): any {
    // If your schema has `enum MetadataType { ACL ... }`
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@prisma/client') as { MetadataType?: typeof MetadataType };
      if (mod?.MetadataType && (mod.MetadataType as any).ACL) {
        return (mod.MetadataType as any).ACL; // enum value
      }
    } catch {}
    // Fallback for string column
    return 'acl';
  }

  @Get('users/:userId/overrides')
  async getOverrides(@Req() req, @Param('userId') userId: string) {
    const tenantId = Number(req.tenant?.id ?? req.tenantId);
    const key = this.key(tenantId, Number(userId));

    const meta = await (this.prisma as any).metadata.findUnique?.({ where: { key } }) ??
                 await (this.prisma as any).metadata.findFirst?.({ where: { key } });

    return meta?.value ?? { add: [], remove: [] };
  }

  @Put('users/:userId/overrides')
  async setOverrides(@Req() req, @Param('userId') userId: string, @Body() dto: OverrideDto) {
    const tenantId = Number(req.tenant?.id ?? req.tenantId);
    const key = this.key(tenantId, Number(userId));
    const mType = this.resolveMetadataType();

    // ✅ Single upsert keeps things atomic and avoids “type missing”
    // NOTE: If your Metadata model requires tenantId column, include it below.
    const dataBase = { key, type: mType, value: dto } as any;

    await (this.prisma as any).metadata.upsert({
      where: { key },              // key must be UNIQUE in your Prisma schema
      update: { value: dto },
      create: {
        ...dataBase,
        // tenantId,               // <- uncomment if your Metadata has non-nullable tenantId
      },
    });

    const permissions = await this.perms.resolveForUser(Number(userId), tenantId);
    return { ok: true, permissions };
  }
}
