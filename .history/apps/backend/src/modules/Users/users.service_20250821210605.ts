// apps/backend/src/modules/users/users.service.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleEnum } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a user and links to the given tenant (schema requires role + tenant).
   */
  async createUserAndAssign(params: {
    email: string;
    name: string;
    password?: string;
    tenantId: number;
    role: RoleEnum; // ADMIN | MANAGER | RECEPTIONIST | CASHIER | WAITER | HOUSEKEEPING
  }) {
    const email = params.email.trim().toLowerCase();
    const { name, password, tenantId, role } = params;

    // 1) unique email check
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('User with this email already exists');

    // 2) hash/generate password
    const rawPw = password ?? (Math.random().toString(36).slice(-8) + 'Aa1!');
    const hash = await bcrypt.hash(rawPw, 10);

    // 3) create user WITH required role + tenant relation (schema requires both)
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hash,
        role,
        tenant: { connect: { id: tenantId } },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // 4) return minimal + temp password if generated
    return {
      user,
      tenantId,
      tempPassword: password ? undefined : rawPw,
    };
  }

  /**
   * Lists users for a tenant.
   * Supports both multi-tenant (UserTenant) and single-tenant (User.tenantId) schemas.
   */
  async listByTenant(tenantId: number) {
    // Try multi-tenant join table first
    try {
      const rows = await (this.prisma as any).userTenant.findMany({
        where: { tenantId },
        select: {
          role: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { id: 'desc' },
      });

      if (Array.isArray(rows) && rows.length) {
        return rows.map((r: any) => ({
          id: r.user.id,
          name: r.user.name,
          email: r.user.email,
          role: r.role as RoleEnum,
        }));
      }
    } catch {
      // ignore; fall back to single-tenant
    }

    // Fallback: single-tenant schema
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { id: 'desc' },
    });
    return users;
  }
}
