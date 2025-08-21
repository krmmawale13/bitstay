import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // Get all customers (ordered by created date descending)
  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }, // ✅ correct camelCase
      include: { addresses: true },
    });
  }

  // Get single customer by ID
  async findOne(id: number) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: { addresses: true },
    });
  }

  // Create customer with optional addresses
  async create(data: {
    name: string;
    email: string;
    phone?: string;
    addresses?: { line1: string; line2?: string; city?: string; state?: string; zip?: string }[];
  }) {
    return this.prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
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
      include: { addresses: true },
    });
  }

  // Update customer
  async update(
    id: number,
    data: Partial<{ name: string; email: string; phone: string }>
  ) {
    return this.prisma.customer.update({
      where: { id },
      data,
      include: { addresses: true },
    });
  }

  // Delete customer
  async delete(id: number) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
