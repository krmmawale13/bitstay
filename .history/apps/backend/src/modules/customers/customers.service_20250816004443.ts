import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    addresses?: { line1: string; line2?: string; city?: string; state?: string; zip?: string }[];
  }) {
    // Single tenant mode: tenantId env se lo
    const tenantId = Number(process.env.DEFAULT_TENANT_ID ?? 1);

    return this.prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        tenant: {
          connect: { id: tenantId },
        },
        addresses: data.addresses?.length
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
      include: { addresses: true, tenant: true },
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      include: { addresses: true, tenant: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: { addresses: true, tenant: true },
    });
  }

  async update(id: number, data: Partial<Prisma.CustomerUpdateInput>) {
    return this.prisma.customer.update({
      where: { id },
      data,
      include: { addresses: true, tenant: true },
    });
  }

  async remove(id: number) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
