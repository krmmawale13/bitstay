import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    const [tenants, customers, bookings] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.customer.count(),
      this.prisma.booking.count(),
    ]);
    return { tenants, customers, bookings };
  }
}