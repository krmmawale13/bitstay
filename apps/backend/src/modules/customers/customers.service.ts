// apps/backend/src/modules/customers/customers.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

// Align with Enterprise Lock v1.0 (CustomerAddress has stateId, districtId, pincode)
type AddressInput = {
  id?: number;                 // for future upsert; current impl recreates all
  line1: string;
  line2?: string | null;
  city?: string | null;
  stateId?: number | null;
  districtId?: number | null;
  pincode?: string | null;

  // backward-compat (map → pincode)
  zip?: string | null;
};

type UpsertCustomerInput = {
  tenantId?: number;           // server will use header tenantId param
  name: string;
  email?: string | null;
  phone?: string | null;
  idTypeId?: number | null;
  idNumber?: string | null;
  dob?: string | null;         // ISO string
  gender?: string | null;
  nationality?: string | null;
  consent?: boolean;
  addresses?: AddressInput[];
};

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // ---------- helpers ----------
  private toPincode(a: AddressInput) {
    return a.pincode ?? a.zip ?? null;
  }

  private mapAddressCreate = (a: AddressInput): Prisma.CustomerAddressCreateWithoutCustomerInput => ({
    line1: a.line1,
    line2: a.line2 ?? null,
    city: a.city ?? null,
    state: a.stateId ? { connect: { id: a.stateId } } : undefined,
    district: a.districtId ? { connect: { id: a.districtId } } : undefined,
    pincode: this.toPincode(a),
  });

  private customerInclude = {
    addresses: { include: { state: true, district: true } },
    idType: true,
    tenant: true,
  } as const;

  // ---------- CRUD ----------
  async create(tenantId: number, data: UpsertCustomerInput) {
    try {
      // email is optional; uniqueness only when provided
      if (data.email) {
        const dup = await this.prisma.customer.findFirst({
          where: { tenantId, email: data.email },
          select: { id: true },
        });
        if (dup) throw new BadRequestException('Customer with this email already exists for this tenant');
      }

      const created = await this.prisma.customer.create({
        data: {
          tenant: { connect: { id: tenantId } },
          name: data.name,
          email: data.email ?? null,
          phone: data.phone ?? null,
          idType: data.idTypeId ? { connect: { id: data.idTypeId } } : undefined,
          idNumber: data.idNumber ?? null,
          dob: data.dob ? new Date(data.dob) : null,
          gender: data.gender ?? null,
          nationality: data.nationality ?? null,
          consent: data.consent ?? false,
          ...(Array.isArray(data.addresses) && data.addresses.length
            ? {
                addresses: {
                  create: data.addresses.map(this.mapAddressCreate),
                },
              }
            : {}),
        },
        include: this.customerInclude,
      });

      return created;
    } catch (error: any) {
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        throw new BadRequestException('Customer with this email already exists for this tenant');
      }
      // eslint-disable-next-line no-console
      console.error('Error creating customer:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to create customer');
    }
  }

  async findAll(tenantId: number) {
    try {
      return await this.prisma.customer.findMany({
        where: { tenantId },
        orderBy: { id: 'desc' },
        include: this.customerInclude,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching customers:', error);
      throw new InternalServerErrorException('Failed to fetch customers');
    }
  }

  async findOne(tenantId: number, id: number) {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: { id, tenantId },
        include: this.customerInclude,
      });
      if (!customer) throw new NotFoundException(`Customer with ID ${id} not found`);
      return customer;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching customer id=${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch customer');
    }
  }

  async update(tenantId: number, id: number, body: UpsertCustomerInput) {
    try {
      const existing = await this.prisma.customer.findFirst({
        where: { id, tenantId },
        select: { id: true, email: true },
      });
      if (!existing) throw new NotFoundException(`Customer with ID ${id} not found`);

      const nextEmail =
        typeof body?.email === 'string' ? body.email : undefined;

      if (nextEmail && nextEmail !== existing.email) {
        const dup = await this.prisma.customer.findFirst({
          where: { tenantId, email: nextEmail, NOT: { id } },
          select: { id: true },
        });
        if (dup) {
          throw new BadRequestException('Another customer with this email already exists for this tenant');
        }
      }

      const data: Prisma.CustomerUpdateInput = {
        name: typeof body?.name === 'string' ? body.name : undefined,
        email: nextEmail ?? undefined,
        phone: typeof body?.phone === 'string' ? body.phone : undefined,
        idType: body.idTypeId
          ? { connect: { id: body.idTypeId } }
          : body?.idTypeId === null
          ? { disconnect: true }
          : undefined,
        idNumber: body.idNumber ?? undefined,
        dob: typeof body?.dob === 'string' ? new Date(body.dob) : undefined,
        gender: body.gender ?? undefined,
        nationality: body.nationality ?? undefined,
        consent: typeof body?.consent === 'boolean' ? body.consent : undefined,
      };

      if (Array.isArray(body?.addresses)) {
        const arr = body.addresses as AddressInput[];
        data.addresses =
          arr.length === 0
            ? { deleteMany: {} }
            : {
                deleteMany: {},
                create: arr.map(this.mapAddressCreate),
              };
      }

      const updated = await this.prisma.customer.update({
        where: { id },
        data,
        include: this.customerInclude,
      });
      return updated;
    } catch (error: any) {
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        throw new BadRequestException('Another customer with this email already exists for this tenant');
      }
      // eslint-disable-next-line no-console
      console.error(`Error updating customer id=${id}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to update customer');
    }
  }

  async remove(tenantId: number, id: number) {
    try {
      const existing = await this.prisma.customer.findFirst({
        where: { id, tenantId },
        select: { id: true },
      });
      if (!existing) throw new NotFoundException(`Customer with ID ${id} not found`);

      try {
        await this.prisma.customer.delete({ where: { id } });
        return { success: true };
      } catch (err: any) {
        // FK guard: if related rows block delete, nuke addresses then delete
        if (err?.code === 'P2003') {
          await this.prisma.$transaction([
            this.prisma.customer.update({
              where: { id },
              data: { addresses: { deleteMany: {} } },
            }),
            this.prisma.customer.delete({ where: { id } }),
          ]);
          return { success: true };
        }
        throw err;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error deleting customer id=${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete customer');
    }
  }

  // ---------- METADATA for dropdowns ----------
  async listStates() {
    try {
      const rows = await this.prisma.state.findMany({
        orderBy: { id: 'asc' },
        select: { id: true, name: true },
      });
      return rows;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching states:', error);
      throw new InternalServerErrorException('Failed to fetch states');
    }
  }

  async listDistricts(stateId?: number) {
    try {
      const where: Prisma.DistrictWhereInput = stateId ? { stateId } : {};
      const rows = await this.prisma.district.findMany({
        where,
        orderBy: [{ stateId: 'asc' }, { id: 'asc' }],
        select: { id: true, name: true, stateId: true },
      });
      return rows;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching districts:', error);
      throw new InternalServerErrorException('Failed to fetch districts');
    }
  }

  async listIdTypes() {
    try {
      const rows = await this.prisma.idType.findMany({
        orderBy: { id: 'asc' },
        select: { id: true, name: true },
      });
      return rows;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching id types:', error);
      throw new InternalServerErrorException('Failed to fetch id types');
    }
  }
}
