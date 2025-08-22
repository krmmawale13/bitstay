// apps/backend/src/modules/users/users.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { RoleEnum } from '@prisma/client';
import { TenantGuard } from '../../common/guards/tenant.guard';

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
  constructor(private readonly users: UsersService) {}

  // ✅ Needed by Access Control → UserOverrides list
  @Get()
  async list(@Req() req) {
    const tenantId = Number(req.tenant?.id ?? req.tenantId);
    if (!tenantId) throw new BadRequestException('tenantId is required (x-tenant-id header)');
    return this.users.listByTenant(tenantId);
  }

  @Post()
  async create(@Req() req, @Body() dto: CreateEmployeeDto) {
    const tenantId =
      dto.tenantId ??
      (req.tenant?.id as number | undefined) ??
      (req.tenantId as number | undefined);

    if (!tenantId) throw new BadRequestException('tenantId is required (x-tenant-id header or body)');

    return this.users.createUserAndAssign({
      email: dto.email,
      name: dto.name,
      password: dto.password,
      role: dto.role,
      tenantId,
    });
  }
}
