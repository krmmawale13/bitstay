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

    // ⚠️ schema me key unique nahi hai; isliye findFirst
    const meta =
      await (this.prisma as any).metadata.findFirst({
        where: { key },
        select: { value: true },
      });

    if (!meta?.value) return { add: [], remove: [] };

    // value String hai → parse safely
    try {
      const parsed = typeof meta.value === 'string' ? JSON.parse(meta.value) : meta.value;
      const add = Array.isArray(parsed?.add) ? parsed.add : [];
      const remove = Array.isArray(parsed?.remove) ? parsed.remove : [];
      return { add, remove };
    } catch {
      return { add: [], remove: [] };
    }
  }

  @Put('users/:userId/overrides')
  async setOverrides(@Req() req: any, @Param('userId') userId: string, @Body() dto: OverrideDto) {
    const tenantId = Number(req?.tenant?.id ?? req?.tenantId);
    const key = this.key(tenantId, Number(userId));

    // normalize + stringify (because metadata.value is String)
    const add: string[] = Array.isArray(dto?.add) ? dto.add : [];
    const remove: string[] = Array.isArray(dto?.remove) ? dto.remove : [];
    const valueString = JSON.stringify({ add, remove });

    // existing row?
    const existing =
      await (this.prisma as any).metadata.findFirst({
        where: { key },
        select: { id: true },
      });

    if (existing?.id) {
      // UPDATE
      await (this.prisma as any).metadata.update({
        where: { id: existing.id },
        data: { value: valueString, type: 'acl' }, // type is plain string in your schema
      });
    } else {
      // CREATE: schema me required relation `version` hai → pehle version banao, phir connect
      // 1) Make sure metadataVersion model exists
      if (
        !(this.prisma as any).metadataVersion?.create ||
        typeof (this.prisma as any).metadataVersion.create !== 'function'
      ) {
        // Agar schema me version required hai par model missing hua to clear error do
        throw new Error('Metadata.version is required by schema, but MetadataVersion model is not available.');
      }

      // 2) Minimal version row (fields default hon to khaali create chalega)
      const versionRow = await (this.prisma as any).metadataVersion.create({
        data: {}, // add fields if your MetadataVersion requires any specific column
        select: { id: true },
      });

      // 3) Create metadata connected to that version
      await (this.prisma as any).metadata.create({
        data: {
          key,
          type: 'acl',        // literal string (NOT JS String)
          value: valueString, // stored as String in your schema
          version: { connect: { id: versionRow.id } },
          // NOTE: agar Metadata model me tenantId non-nullable ho to yahan add karo:
          // tenantId,
        },
      });
    }

    const permissions = await this.perms.resolveForUser(Number(userId), tenantId);
    return { ok: true, permissions };
  }
}
