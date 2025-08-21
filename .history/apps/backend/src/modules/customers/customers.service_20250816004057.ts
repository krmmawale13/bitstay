import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  private isMultiTenant() {
    return process.env.TENANT_MODE === 'multi';
  }

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    addresses?: { line1: string; line2?: string; city?: string; state?: string; zip?: string }[];
    tenantId?: number;
  }) {
    return this.prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        ...(this.isMultiTenant() && data.tenantId
          ? { tenant: { connect: { id: data.tenantId } } }
          : {}),
        addresses: data.addresses
          ? {
              create: data.addresses.map((addr) => ({
                line1: addr.line1,
                line2: addr.line2,
                city: addr.city,
                state: addr.state,
                zip: addr.zip,
              })),
            }
          : undefined,
      },
      include: { addresses: true, tenant: this.isMultiTenant() },
    });
  }

  async findAll(tenantId?: number) {
    return this.prisma.customer.findMany({
      where: this.isMultiTenant() && tenantId ? { tenantId } : undefined,
      include: { addresses: true, tenant: this.isMultiTenant() },
    });
  }

  async findOne(id: number, tenantId?: number) {
    return this.prisma.customer.findFirst({
      where: {
        id,
        ...(this.isMultiTenant() && tenantId ? { tenantId } : {}),
      },
      include: { addresses: true, tenant: this.isMultiTenant() },
    });
  }

  async update(id: number, data: Partial<Prisma.CustomerUpdateInput>, tenantId?: number) {
    return this.prisma.customer.updateMany({
      where: {
        id,
        ...(this.isMultiTenant() && tenantId ? { tenantId } : {}),
      },
      data,
    });
  }

  async remove(id: number, tenantId?: number) {
    return this.prisma.customer.deleteMany({
      where: {
        id,
        ...(this.isMultiTenant() && tenantId ? { tenantId } : {}),
      },
    });
  }
}
