import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';              // relative path
import { TenantGuard } from '../../common/guards/tenant.guard';        // relative path
import { PermissionsService } from '../auth/permissions.service';      // relative path

type OverrideDto = { add?: string[]; remove?: string[] };

@UseGuards(TenantGuard)
@Controller('settings/access')
export class AccessController {  // <-- NAMED EXPORT (required)
  constructor(private prisma: PrismaService, private perms: PermissionsService) {}

  private key(tenantId: number, userId: number) {
    return `acl:user:${tenantId}:${userId}`;
  }

  @Get('users/:userId/overrides')
  async getOverrides(@Req() req, @Param('userId') userId: string) {
    const tenantId = Number(req.tenant?.id);
    const key = this.key(tenantId, Number(userId));
    const meta = await (this.prisma as any).metadata.findFirst({
      where: { key },
      select: { id: true, value: true },
    });
    return meta?.value ?? { add: [], remove: [] };
  }

  @Put('users/:userId/overrides')
  async setOverrides(@Req() req, @Param('userId') userId: string, @Body() dto: OverrideDto) {
    const tenantId = Number(req.tenant?.id);
    const key = this.key(tenantId, Number(userId));

    const existing = await (this.prisma as any).metadata.findFirst({
      where: { key },
      select: { id: true },
    });

    if (existing) {
      await (this.prisma as any).metadata.update({
        where: { id: existing.id },
        data: { value: dto },
      });
    } else {
      await (this.prisma as any).metadata.create({
        data: { key, value: dto },
      });
    }

    const permissions = await this.perms.resolveForUser(Number(userId), tenantId);
    return { ok: true, permissions };
  }
}
