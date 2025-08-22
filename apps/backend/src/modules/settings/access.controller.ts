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

  /**
   * Ensure one stable MetadataVersion row per-tenant for ACL overrides.
   * We'll name it 'acl' so we can always reuse it.
   */
  private async ensureAclVersion(tenantId: number) {
    // try to find existing
    const existing = await (this.prisma as any).metadataVersion.findFirst({
      where: { tenantId, version: 'acl' },
      select: { id: true },
    });
    if (existing) return existing;

    // create new (NOTE: tenant relation is required)
    const created = await (this.prisma as any).metadataVersion.create({
      data: {
        tenant: { connect: { id: tenantId } }, // ✅ REQUIRED tenant link
        version: 'acl',                         // ✅ REQUIRED string
        // notes: 'ACL overrides container',    // optional
      },
      select: { id: true },
    });
    return created;
  }

  @Get('users/:userId/overrides')
  async getOverrides(@Req() req: any, @Param('userId') userId: string) {
    const tenantId = Number(req?.tenant?.id ?? req?.tenantId);
    const key = this.key(tenantId, Number(userId));

    // scope by tenant's ACL version, then lookup by key
    const ver = await this.ensureAclVersion(tenantId);

    const meta = await (this.prisma as any).metadata.findFirst({
      where: { key, versionId: ver.id },
      select: { value: true },
    });

    if (!meta?.value) return { add: [], remove: [] };

    // value column is String → parse safely
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

    // make sure we have the tenant-scoped ACL version row
    const ver = await this.ensureAclVersion(tenantId);

    // check if metadata row already exists for this key + version
    const existing = await (this.prisma as any).metadata.findFirst({
      where: { key, versionId: ver.id },
      select: { id: true },
    });

    if (existing?.id) {
      // UPDATE path
      await (this.prisma as any).metadata.update({
        where: { id: existing.id },
        data: {
          type: 'acl',        // simple string
          value: valueString, // stringified JSON
        },
      });
    } else {
      // CREATE path (versionId is required)
      await (this.prisma as any).metadata.create({
        data: {
          key,
          type: 'acl',
          value: valueString,
          version: { connect: { id: ver.id } }, // ✅ REQUIRED relation via versionId
          // createdAt auto handled
        },
      });
    }

    const permissions = await this.perms.resolveForUser(Number(userId), tenantId);
    return { ok: true, permissions };
  }
}
