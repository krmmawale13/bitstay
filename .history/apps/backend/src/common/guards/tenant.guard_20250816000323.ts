import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'] || request.query.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    // Convert to number if your tenantId is numeric
    const parsedTenantId = isNaN(Number(tenantId))
      ? tenantId
      : Number(tenantId);

    // If you store allowed tenantIds in user.tenants
    if (user.tenants && Array.isArray(user.tenants)) {
      const allowed = user.tenants.some(
        (t) =>
          t.id === parsedTenantId ||
          t.tenantId === parsedTenantId ||
          t.code === parsedTenantId,
      );
      if (!allowed) {
        throw new ForbiddenException(
          `Access to tenant ${tenantId} is not allowed for this user`,
        );
      }
    }

    // If you store single tenantId on the user
    if (user.tenantId && user.tenantId !== parsedTenantId) {
      throw new ForbiddenException(
        `Access to tenant ${tenantId} is not allowed for this user`,
      );
    }

    // Attach parsed tenantId for controllers/services to use
    request.tenantId = parsedTenantId;
    return true;
  }
}
