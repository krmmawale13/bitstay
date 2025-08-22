// apps/backend/src/modules/auth/auth.controller.ts
import { Controller, Post, Body, Get, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsService } from './permissions.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly perms: PermissionsService,
  ) {}

  @Public()
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  /**
   * Returns the effective permissions for the current user in the active tenant.
   * Requires:
   *  - AuthGuard to populate req.user.userId (your global guard)
   *  - TenantGuard to validate x-tenant-id and populate req.tenant.id
   */
  @UseGuards(TenantGuard)
  @Get('permissions')
  async permissions(@Req() req: any) {
    const userIdRaw = req?.user?.userId;
    const tenantIdRaw = req?.tenant?.id ?? req?.tenantId;

    const userId = Number(userIdRaw);
    const tenantId = Number(tenantIdRaw);

    if (!Number.isFinite(userId)) {
      throw new BadRequestException('Invalid or missing user id.');
    }
    if (!Number.isFinite(tenantId)) {
      throw new BadRequestException('Invalid or missing tenant id.');
    }

    const permissions = await this.perms.resolveForUser(userId, tenantId);
    // Always return an array (never null/undefined)
    return { permissions: Array.isArray(permissions) ? permissions : [] };
  }
}
