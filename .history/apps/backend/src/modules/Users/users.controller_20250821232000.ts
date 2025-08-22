// apps/backend/src/modules/users/users.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleEnum } from '@prisma/client';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { UsersService } from './users.service';

class CreateEmployeeDto {
  email!: string;
  name!: string;
  password?: string;
  role!: RoleEnum;
  tenantId?: number; // optional
}

@UseGuards(TenantGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  // 🔹 LIST (handles both schemas)
  @Get()
  async list(@Req() req) {
    const tenantId =
      Number(req.tenant?.id ?? req.tenantId ?? req.headers['x-tenant-id']);
    if (!tenantId) return [];

    // Try multi-tenant bridge first (UserTenant)
    const hasUT =
      (this.prisma as any).userTenant?.findMany &&
      typeof (this.prisma as any).userTenant.findMany === 'function';

    if (hasUT) {
      const rows = await (this.prisma as any).userTenant.findMany({
        where: { tenantId },
        select: {
          role: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ userId: 'asc' }],
      });

      return rows.map((r: any) => ({
        id: r.user?.id,
        name: r.user?.name ?? 'User',
        email: r.user?.email ?? '-',
        role: r.role ?? null,
      }));
    }

    // Fallback: single-tenant (User.tenantId)
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { id: 'asc' },
    });
    return users;
  }

  // 🔹 CREATE (existing)
  @Post()
  async create(@Req() req, @Body() dto: CreateEmployeeDto) {
    const tenantId =
      dto.tenantId ??
      (req.tenant?.id as number | undefined) ??
      (req.tenantId as number | undefined);

    if (!tenantId) throw new Error('tenantId is required (x-tenant-id header or body)');

    return this.users.createUserAndAssign({
      email: dto.email,
      name: dto.name,
      password: dto.password,
      role: dto.role,
      tenantId,
    });
  }
}
