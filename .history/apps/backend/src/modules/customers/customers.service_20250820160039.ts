import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  private getTenantId(): number {
    return Number(process.env.DEFAULT_TENANT_ID ?? 1);
  }

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    addresses?: { line1: string; line2?: string; city?: string; state?: string; zip?: string }[];
  }) {
    try {
      const tenantId = this.getTenantId();

      // 🔹 Duplicate check (email + tenantId)
      const existingCustomer = await this.prisma.customer.findFirst({
        where: { email: data.email, tenantId },
      });
      if (existingCustomer) {
        throw new BadRequestException(
          'Customer with this email already exists for this tenant',
        );
      }

      return await this.prisma.customer.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          tenant: { connect: { id: tenantId } },
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
    } catch (error: any) {
      // Prisma unique fallback, just in case race condition ho
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        throw new BadRequestException(
          'Customer with this email already exists for this tenant',
        );
      }
      // eslint-disable-next-line no-console
      console.error('Error creating customer:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to create customer');
    }
  }

  async findAll() {
    try {
      return await this.prisma.customer.findMany({
        include: { addresses: true, tenant: true },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching customers:', error);
      throw new InternalServerErrorException('Failed to fetch customers');
    }
  }

  async findOne(id: number) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        include: { addresses: true, tenant: true },
      });
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }
      return customer;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching customer with id ${id}:`, error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to fetch customer');
    }
  }

  async update(id: number, data: Partial<Prisma.CustomerUpdateInput>) {
    try {
      const existing = await this.prisma.customer.findUnique({
        where: { id },
        select: { id: true, tenantId: true, email: true },
      });
      if (!existing) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      // 🔹 Agar email change ho rahi hai, to duplicate check (same tenant, different id)
      const nextEmail =
        typeof data.email === 'string'
          ? data.email
          : (data.email as any)?.set ?? undefined;

      if (nextEmail && nextEmail !== existing.email) {
        const dup = await this.prisma.customer.findFirst({
          where: {
            email: nextEmail,
            tenantId: existing.tenantId,
            NOT: { id },
          },
          select: { id: true },
        });
        if (dup) {
          throw new BadRequestException(
            'Another customer with this email already exists for this tenant',
          );
        }
      }

      return await this.prisma.customer.update({
        where: { id },
        data,
        include: { addresses: true, tenant: true },
      });
    } catch (error: any) {
      // Prisma unique fallback
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        throw new BadRequestException(
          'Another customer with this email already exists for this tenant',
        );
      }
      // eslint-disable-next-line no-console
      console.error(`Error updating customer with id ${id}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException)
        throw error;
      throw new InternalServerErrorException('Failed to update customer');
    }
  }

  async remove(id: number) {
    try {
      const existing = await this.prisma.customer.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      return await this.prisma.customer.delete({ where: { id } });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error deleting customer with id ${id}:`, error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to delete customer');
    }
  }
}
