// apps/backend/src/modules/customers/customers.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@UseGuards(TenantGuard) // ⬅️ add this (AuthGuard is already global)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@TenantId() tenantId: number, @Body() body: any) {
    return this.customersService.create(tenantId, body);
  }

  @Get()
  findAll(@TenantId() tenantId: number) {
    return this.customersService.findAll(tenantId);
  }

  // --------- METADATA (for dropdowns) ---------
  @Get('states')
  listStates() {
    return this.customersService.listStates();
  }

  @Get('districts')
  listDistricts(@Query('stateId') stateId?: string) {
    return this.customersService.listDistricts(stateId ? Number(stateId) : undefined);
  }

  @Get('id-types')
  listIdTypes() {
    return this.customersService.listIdTypes();
  }

  // --------- CUSTOMER CRUD ---------
  @Get(':id')
  findOne(@TenantId() tenantId: number, @Param('id') id: string) {
    return this.customersService.findOne(tenantId, Number(id));
  }

  @Put(':id')
  update(@TenantId() tenantId: number, @Param('id') id: string, @Body() body: any) {
    return this.customersService.update(tenantId, Number(id), body);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: number, @Param('id') id: string) {
    return this.customersService.remove(tenantId, Number(id));
  }
}
