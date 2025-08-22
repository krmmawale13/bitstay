// apps/backend/src/modules/settings/access.controller.ts
import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsService } from '../auth/permissions.service';

type OverrideDto = { add?: string[]; remove?: string[] };

@UseGuards(TenantGuard)
@Controller('settings/access')
export class AccessController {
  constructor(private prisma: PrismaService, private perms: PermissionsService) {}

  private key(tenantId: number, userId: number) {
    return `acl:user:${tenantId}:${userId}`;
  }

  @Get('users/:userId/overrides')
  async getOverrides(@Req() req, @Param('userId') userId: string) {
    const tenantId = Number(req.tenant?.id ?? req.tenantId);
    const key = this.key(tenantId, Number(userId));

    // ❌ DO NOT use findUnique (key not unique in your schema)
    const meta = await (this.prisma as any).metadata.findFirst({
      where: { key },
      select: { value: true },
    });

    // value is String in your schema → parse safely
    if (!meta?.value) return { add: [], remove: [] };

    try {
      const parsed = typeof meta.value === 'string' ? JSON.parse(meta.value) : meta.value;
      const add = Array.isArray(parsed?.add) ? parsed.add : [];
      const remove = Array.isArray(parsed?.remove) ? parsed.remove : [];
      return { add, remove };
    } catch {
      // corrupted / non-JSON value – fail-safe
      return { add: [], remove: [] };
    }
  }

  @Put('users/:userId/overrides')
  async setOverrides(@Req() req, @Param('userId') userId: string, @Body() dto: OverrideDto) {
    const tenantId = Number(req.tenant?.id ?? req.tenantId);
    const key = this.key(tenantId, Number(userId));

    // normalize dto
    const add = Array.isArray(dto?.add) ? dto.add : [];
    const remove = Array.isArray(dto?.remove) ? dto.remove : [];
    const valueString = JSON.stringify({ add, remove }); // your schema value is String

    // Upsert WITHOUT unique: findFirst → update by id OR create
    const existing = await (this.prisma as any).metadata.findFirst({
      where: { key },
      select: { id: true },
    });

    if (existing?.id) {
      await (this.prisma as any).metadata.update({
        where: { id: existing.id },
        data: { value: valueString, type: 'acl' }, // type is plain string in your schema
      });
    } else {
      await (this.prisma as any).metadata.create({
        data: {
          key,
          type: 'acl',          // ✅ plain string, NOT `String`
          value: valueString,   // ✅ stringify since column is String
          // tenantId,           // uncomment IF your metadata model requires tenantId column
        },
      });
    }

    const permissions = await this.perms.resolveForUser(Number(userId), tenantId);
    return { ok: true, permissions };
  }
}
