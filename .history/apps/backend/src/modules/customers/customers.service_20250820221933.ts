// apps/backend/src/modules/customers/customers.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

type AddressInput = {
  line1: string;
  line2?: string | null;
  city?: string | null;
  zip?: string | null;
  // NEW: dropdown se aayega
  stateCode?: string | null;
  // LEGACY: ignore as string; relation use karenge
  state?: string | null;
};

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  private getTenantId(): number {
    return Number(process.env.DEFAULT_TENANT_ID ?? 1);
  }

  /** Map a single address input to Prisma nested create with State connect */
  private mapAddressCreate(a: AddressInput, tenantId: number): Prisma.AddressCreateWithoutCustomerInput {
    const base = {
      line1: a.line1,
      line2: a.line2 ?? undefined,
      city: a.city ?? undefined,
      zip: a.zip ?? undefined,
      tenant: { connect: { id: tenantId } },
    } as Prisma.AddressCreateWithoutCustomerInput;

    const code = a.stateCode?.trim().toUpperCase();
    if (code) {
      return {
        ...base,
        state: { connect: { code } }, // or connectOrCreate if you want to auto-seed
      };
    }
    return base; // no state relation
  }

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    // NOTE: addresses may carry stateCode now
    addresses?: AddressInput[];
  }) {
    try {
      const tenantId = this.getTenantId();

      // duplicate check within tenant
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
          ...(data.addresses?.length
            ? {
                addresses: {
                  create: data.addresses.map((addr) => this.mapAddressCreate(addr, tenantId)),
                },
              }
            : {}),
        },
        include: { addresses: { include: { state: true } }, tenant: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        throw new BadRequestException('Customer with this email already exists for this tenant');
      }
      console.error('Error creating customer:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to create customer');
    }
  }

  async findAll() {
    try {
      return await this.prisma.customer.findMany({
        include: { addresses: { include: { state: true } }, tenant: true },
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw new InternalServerErrorException('Failed to fetch customers');
    }
  }

  async findOne(id: number) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        include: { addresses: { include: { state: true } }, tenant: true },
      });
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }
      return customer;
    } catch (error) {
      console.error(`Error fetching customer with id ${id}:`, error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to fetch customer');
    }
  }

  async update(id: number, body: any) {
    try {
      // ensure exists; we need tenantId for address create
      const existing = await this.prisma.customer.findUnique({
        where: { id },
        select: { id: true, tenantId: true, email: true },
      });
      if (!existing) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      // email change guard within tenant
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

      const updateData: Prisma.CustomerUpdateInput = {};
      if (typeof body?.name === 'string') updateData.name = body.name;
      if (nextEmail) updateData.email = nextEmail;
      if (typeof body?.phone === 'string') updateData.phone = body.phone;

      // Replace-all addresses (predictable for form)
      if (Array.isArray(body?.addresses)) {
        const arr = body.addresses as AddressInput[];

        updateData.addresses =
          arr.length === 0
            ? { deleteMany: {} }
            : {
                deleteMany: {},
                create: arr.map((a) => this.mapAddressCreate(a, existing.tenantId)),
              };
      }

      return await this.prisma.customer.update({
        where: { id },
        data: updateData,
        include: { addresses: { include: { state: true } }, tenant: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        throw new BadRequestException(
          'Another customer with this email already exists for this tenant',
        );
      }
      console.error(`Error updating customer with id ${id}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to update customer');
    }
  }

  /** Dropdown data (code + name) */
  async listStates() {
    try {
      const rows = await this.prisma.state.findMany({
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
      });
      return rows;
    } catch (error) {
      console.error('Error fetching states:', error);
      throw new InternalServerErrorException('Failed to fetch states');
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
        return await this.prisma.customer.delete({ where: { id } });
      } catch (err: any) {
        if (err?.code === 'P2003') {
          await this.prisma.$transaction([
            this.prisma.customer.update({
              where: { id },
              data: { addresses: { deleteMany: {} } },
            }),
            this.prisma.customer.delete({ where: { id } }),
          ]);
          return existing;
        }
        throw err;
      }
    } catch (error) {
      console.error(`Error deleting customer with id ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete customer');
    }
  }
}
