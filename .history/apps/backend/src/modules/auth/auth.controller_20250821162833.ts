import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
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

  // Frontend ke liye: current user + tenant ke effective permissions
  @UseGuards(TenantGuard)
  @Get('permissions')
  async permissions(@Req() req) {
    const userId = req.user?.userId;          // set by AuthGuard from JWT
    const tenantId = Number(req.tenant?.id);  // set by TenantGuard from x-tenant-id
    const permissions = await this.perms.resolveForUser(userId, tenantId);
    return { permissions };
  }
}
