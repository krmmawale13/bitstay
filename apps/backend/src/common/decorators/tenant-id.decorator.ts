import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Usage in controllers:
 *   someRoute(@TenantId() tenantId: number) { ... }
 *
 * Reads tenantId in this priority:
 *   1) Header: x-tenant-id
 *   2) Query:  ?tenantId=123
 *   3) Body:   { tenantId: 123 }
 *   4) req.user.tenantId or first of req.user.tenantIds (if your auth attaches it)
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    const req = ctx.switchToHttp().getRequest();

    const fromHeader = req.headers?.['x-tenant-id'];
    const fromQuery = req.query?.tenantId;
    const fromBody  = req.body?.tenantId;

    // fallback to auth payload if available
    const fromUser =
      req.user?.tenantId ??
      (Array.isArray(req.user?.tenantIds) ? req.user.tenantIds[0] : undefined);

    const raw = fromHeader ?? fromQuery ?? fromBody ?? fromUser;

    let parsed: number | undefined;
    if (typeof raw === 'string') parsed = parseInt(raw, 10);
    else if (typeof raw === 'number') parsed = raw;

    return Number.isFinite(parsed as number) ? (parsed as number) : undefined;
  },
);
