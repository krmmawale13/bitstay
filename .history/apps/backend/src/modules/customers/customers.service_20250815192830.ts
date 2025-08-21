// src/modules/customers/customers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // Get all customers
  async findAll() {
    return this.prisma.customers.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get single customer by ID
  async findOne(id: number) {
    const customer = await this.prisma.customers.findUnique({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  // Create customer
  async create(data: Prisma.CustomersCreateInput) {
    return this.prisma.customers.create({ data });
  }

  // Update customer
  async update(id: number, data: Prisma.CustomersUpdateInput) {
    await this.findOne(id); // Ensure exists
    return this.prisma.customers.update({
      where: { id },
      data,
    });
  }

  // Delete customer
  async remove(id: number) {
    await this.findOne(id); // Ensure exists
    return this.prisma.customers
