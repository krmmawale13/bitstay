import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    const tenantId = Number(req.tenant.id);
    const key = this.key(tenantId, Number(userId));
    const meta = await this.prisma.metadata.findUnique({ where: { key }, select: { value: true } });
    return meta?.value ?? { add: [], remove: [] };
  }

  @Put('users/:userId/overrides')
  async setOverrides(@Req() req, @Param('userId') userId: string, @Body() dto: OverrideDto) {
    const tenantId = Number(req.tenant.id);
    const key = this.key(tenantId, Number(userId));
    await this.prisma.metadata.upsert({
      where: { key },
      update: { value: dto },
      create: { key, value: dto },
    });
    // return effective permissions for instant UI update
    const permissions = await this.perms.resolveForUser(Number(userId), tenantId);
    return { ok: true, permissions };
  }
}
