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

      // Duplicate check (email + tenant)
      const existingCustomer = await this.prisma.customer.findFirst({
        where: { email: data.email, tenantId },
      });
      if (existingCustomer) {
        throw new BadRequestException('Customer with this email already exists for this tenant');
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
      // Prisma unique race fallback
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        throw new BadRequestException('Customer with this email already exists for this tenant');
      }
      // eslint-disable-next-line no-console
      console.error('Error creating customer:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to create customer');
    }
  }

  async findAll() {
    try {
      // Keeping as-is (no tenant filter) to match your current view module usage
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

  async update(id: number, body: any) {
    try {
      // Ensure record exists; grab tenantId for duplicate check
      const existing = await this.prisma.customer.findUnique({
        where: { id },
        select: { id: true, tenantId: true, email: true },
      });
      if (!existing) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      // Email change guard (same tenant)
      const nextEmail: string | undefined =
        typeof body?.email === 'string'
          ? body.email
          : (body?.email as any)?.set ?? undefined;

      if (nextEmail && nextEmail !== existing.email) {
        const dup = await this.prisma.customer.findFirst({
          where: { email: nextEmail, tenantId: existing.tenantId, NOT: { id } },
          select: { id: true },
        });
        if (dup) {
          throw new BadRequestException(
            'Another customer with this email already exists for this tenant',
          );
        }
      }

      // Map to Prisma.CustomerUpdateInput
      const updateData: Prisma.CustomerUpdateInput = {};

      if (typeof body?.name === 'string') updateData.name = body.name;
      if (nextEmail) updateData.email = nextEmail;
      if (typeof body?.phone === 'string') updateData.phone = body.phone;

      // Replace-all strategy for addresses (safe + predictable for add/edit screens)
      if (Array.isArray(body?.addresses)) {
        const arr = body.addresses as Array<{
          line1: string;
          line2?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
        }>;

        updateData.addresses =
          arr.length === 0
            ? { deleteMany: {} }
            : {
                deleteMany: {},
                create: arr.map((a) => ({
                  line1: a.line1,
                  line2: a.line2 ?? null,
                  city: a.city ?? null,
                  state: a.state ?? null,
                  zip: a.zip ?? null,
                })),
              };
      }

      return await this.prisma.customer.update({
        where: { id },
        data: updateData,
        include: { addresses: true, tenant: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        throw new BadRequestException(
          'Another customer with this email already exists for this tenant',
        );
      }
      // eslint-disable-next-line no-console
      console.error(`Error updating customer with id ${id}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to update customer');
    }
  }

  async remove(id: number) {
    try {
      const existing = await this.prisma.customer.findUnique({
        where: { id },
        include: { addresses: true, tenant: true },
      });
      if (!existing) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      try {
        // Works if FK is CASCADE or no children exist
        return await this.prisma.customer.delete({ where: { id } });
      } catch (err: any) {
        // FK constraint -> clear children via nested write, then delete
        if (err?.code === 'P2003') {
          await this.prisma.$transaction([
            this.prisma.customer.update({
              where: { id },
              data: { addresses: { deleteMany: {} } }, // nested delete; no child model name needed
            }),
            this.prisma.customer.delete({ where: { id } }),
          ]);
          // Return the record we had fetched before delete
          return existing;
        }
        throw err;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error deleting customer with id ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete customer');
    }
  }
}
