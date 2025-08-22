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

    // 1) Read tenant from header or query
    const rawTenantId = request.headers['x-tenant-id'] ?? request.query.tenantId;
    if (!rawTenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    // normalize to number if numeric
    const parsedTenantId = isNaN(Number(rawTenantId)) ? rawTenantId : Number(rawTenantId);

    // 2) Validate against JWT payload structure
    // JWT has: user.tenantIds (array of allowed IDs) — from AuthService
    const allowedIds: any[] = Array.isArray(user?.tenantIds)
      ? user.tenantIds
      : user?.tenantId
      ? [user.tenantId]
      : [];

    if (allowedIds.length > 0) {
      // numeric compare (coerce both sides) to be safe
      const ok = allowedIds.some((t) => String(t) === String(parsedTenantId));
      if (!ok) {
        throw new ForbiddenException(
          `Access to tenant ${rawTenantId} is not allowed for this user`,
        );
      }
    }
    // If no allowedIds present, we skip strict check (compatible with seeds where tenant binding may be added later)

    // 3) Attach normalized tenant in the shape controllers expect
    request.tenant = { id: parsedTenantId };  // <-- important
    request.tenantId = parsedTenantId;        // optional: keep legacy

    return true;
  }
}
