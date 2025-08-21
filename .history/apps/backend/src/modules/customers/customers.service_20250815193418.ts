import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // Get all customers (ordered by created date descending)
  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }, // ✅ camelCase field
      include: {
        addresses: true, // if you want to fetch related addresses
      },
    });
  }

  // Get single customer by ID
  async findOne(id: number) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
      },
    });
  }

  // Create new customer
  async create(data: {
    name: string;
    email: string;
    phone?: string;
    addresses?: { street: string; city?: string; state?: string; zip?: string }[];
  }) {
    return this.prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        addresses: data.addresses
          ? {
              create: data.addresses.map((addr) => ({
                street: addr.street,
                city: addr.city,
                state: addr.state,
                zip: addr.zip,
              })),
            }
          : undefined,
      },
    });
  }

  // Update customer
  async update(id: number, data: Partial<{ name: string; email: string; phone: string }>) {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  // Delete customer
  async delete(id: number) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
