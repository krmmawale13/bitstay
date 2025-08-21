import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customers.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.customers.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.customers.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.customers.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.customers.delete({
      where: { id },
    });
  }
}
