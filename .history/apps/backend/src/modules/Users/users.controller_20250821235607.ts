import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleEnum } from '@prisma/client';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { UsersService } from './users.service';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class CreateEmployeeDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsEnum(RoleEnum)
  role!: RoleEnum;

  @IsOptional()
  @Type(() => Number)   // header/body string -> number
  @IsInt()
  tenantId?: number; // optional
}

@UseGuards(TenantGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@Req() req) {
    const raw = Array.isArray(req.headers['x-tenant-id'])
      ? req.headers['x-tenant-id'][0]
      : req.headers['x-tenant-id'];
    const tenantId = Number(req.tenant?.id ?? req.tenantId ?? raw);
    if (!tenantId) return [];
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { id: 'asc' },
    });
    return users;
  }

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
