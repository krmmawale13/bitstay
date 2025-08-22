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
  async getOverrides(@Req() req: any, @Param('userId') userId: string) {
    const tenantId = Number(req?.tenant?.id ?? req?.tenantId);
    const key = this.key(tenantId, Number(userId));

    // key unique nahi hai → findFirst
    const meta = await (this.prisma as any).metadata.findFirst({
      where: { key },
      select: { value: true },
    });

    if (!meta?.value) return { add: [], remove: [] };

    // value String column hai → safe parse
    try {
      const parsed = typeof meta.value === 'string' ? JSON.parse(meta.value) : meta.value;
      return {
        add: Array.isArray(parsed?.add) ? parsed.add : [],
        remove: Array.isArray(parsed?.remove) ? parsed.remove : [],
      };
    } catch {
      return { add: [], remove: [] };
    }
  }

  @Put('users/:userId/overrides')
  async setOverrides(@Req() req: any, @Param('userId') userId: string, @Body() dto: OverrideDto) {
    const tenantId = Number(req?.tenant?.id ?? req?.tenantId);
    const key = this.key(tenantId, Number(userId));

    const add = Array.isArray(dto?.add) ? dto.add : [];
    const remove = Array.isArray(dto?.remove) ? dto.remove : [];
    const valueString = JSON.stringify({ add, remove }); // Metadata.value is String

    // Pehle existing row dekh lo
    const existing = await (this.prisma as any).metadata.findFirst({
      where: { key },
      select: { id: true },
    });

    if (existing?.id) {
      // UPDATE
      await (this.prisma as any).metadata.update({
        where: { id: existing.id },
        data: {
          value: valueString,
          type: 'acl', // plain string
        },
      });
    } else {
      // CREATE path: schema me required relation 'version' hai → pehle version row
      // NOTE: tumhare model me `MetadataVersion.version` (String, required) hai.
      // Ek sensible value daal dete hain (e.g., ISO timestamp ya semantic).
      const versionValue = `acl-${tenantId}-${userId}-${new Date().toISOString()}`;

      const versionRow = await (this.prisma as any).metadataVersion.create({
        data: {
          version: versionValue, // ✅ REQUIRED string field
        },
        select: { id: true },
      });

      // ab Metadata create + connect version
      await (this.prisma as any).metadata.create({
        data: {
          key,
          type: 'acl',        // ✅ plain string
          value: valueString, // ✅ String column
          version: { connect: { id: versionRow.id } },
          // tenantId,         // 👈 uncomment if your Metadata model has non-null tenantId
        },
      });
    }

    const permissions = await this.perms.resolveForUser(Number(userId), tenantId);
    return { ok: true, permissions };
  }
}
