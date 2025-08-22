import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RoleEnum } from '@prisma/client';
import { TenantGuard } from '../../common/guards/tenant.guard';

class CreateEmployeeDto {
  email!: string;
  name!: string;
  password?: string;                 // optional → temp will be generated
  role!: RoleEnum;                   // ADMIN | MANAGER | RECEPTIONIST | CASHIER | WAITER | HOUSEKEEPING
  tenantId?: number;                 // optional; if not sent, we'll use x-tenant-id
}

@UseGuards(TenantGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateEmployeeDto) {
    const tenantId = dto.tenantId ?? Number(req.tenant?.id);
    if (!tenantId) {
      throw new Error('tenantId is required (header x-tenant-id or body)');
    }

    return this.users.createUserAndAssign({
      email: dto.email,
      name: dto.name,
      password: dto.password,
      role: dto.role,
      tenantId,
    });
  }
}
