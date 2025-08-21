import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get('summary')
  async summary(@TenantId() tenantId?: number) {
    return this.svc.getSummary(tenantId);
  }

  @Get('revenue-7d')
  async revenue7d(@TenantId() tenantId?: number) {
    return this.svc.getRevenue7d(tenantId);
  }

  @Get('booking-mix-today')
  async bookingMixToday(@TenantId() tenantId?: number) {
    return this.svc.getBookingMixToday(tenantId);
  }
}
