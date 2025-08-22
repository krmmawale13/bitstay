// apps/backend/src/common/guards/tenant.guard.ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    const raw = req.headers['x-tenant-id'] ?? req.query.tenantId;
    if (!raw) throw new ForbiddenException('Tenant ID is required');

    const tenantId = isNaN(Number(raw)) ? raw : Number(raw);

    // JWT: single-tenant → tenantIds or tenantId
    const allowed = Array.isArray(user?.tenantIds)
      ? user.tenantIds
      : (user?.tenantId != null ? [user.tenantId] : []);

    if (allowed.length) {
      const ok = allowed.some((t) => String(t) === String(tenantId));
      if (!ok) throw new ForbiddenException(`Access to tenant ${raw} is not allowed for this user`);
    }

    // normalize for controllers
    req.tenant = { id: tenantId };
    req.tenantId = tenantId;
    return true;
  }
}
