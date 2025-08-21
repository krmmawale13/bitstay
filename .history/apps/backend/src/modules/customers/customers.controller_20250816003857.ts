import { Controller, Get, Post, Body, Param, Delete, Put, Req } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Request } from 'express';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() body: any, @Req() req: Request) {
    const tenantId = this.extractTenantId(req);
    return this.customersService.create(body, tenantId);
  }

  @Get()
  findAll(@Req() req: Request) {
    const tenantId = this.extractTenantId(req);
    return this.customersService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.extractTenantId(req);
    return this.customersService.findOne(Number(id), tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const tenantId = this.extractTenantId(req);
    return this.customersService.update(Number(id), body, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.extractTenantId(req);
    return this.customersService.remove(Number(id), tenantId);
  }

  /**
   * Extract tenantId from request in a way that works for:
   * - Multi-tenant mode (comes from JWT payload or headers)
   * - Single-tenant mode (defaults to null)
   */
  private extractTenantId(req: Request): number | null {
    // If multi-tenant mode and user is authenticated, tenantId may come from JWT
    const jwtUser = (req as any).user;
    if (jwtUser?.tenantId) return Number(jwtUser.tenantId);

    // Or tenantId might be passed in headers
    if (req.headers['x-tenant-id']) return Number(req.headers['x-tenant-id']);

    // Single-tenant mode: return null (service can ignore tenant filter)
    return null;
  }
}
