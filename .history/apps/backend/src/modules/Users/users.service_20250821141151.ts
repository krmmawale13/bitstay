import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // adjust if your path differs
import { RoleEnum } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a system user (employee) and assign a role for a given tenant
   * Schema-aligned: uses User + UserTenant (join) with RoleEnum
   */
  async createUserAndAssign(params: {
    email: string;
    name: string;
    password?: string;        // optional, will generate if missing
    tenantId: number;
    role: RoleEnum;           // ADMIN | MANAGER | RECEPTIONIST | CASHIER | WAITER | HOUSEKEEPING
  }) {
    const { email, name, password, tenantId, role } = params;

    // 1) ensure email unique
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new Error('User with this email already exists');
    }

    // 2) hash password (or generate temp)
    const rawPw = password ?? (Math.random().toString(36).slice(-8) + 'Aa1!');
    const hash = await bcrypt.hash(rawPw, 10);

    // 3) create user
    const user = await this.prisma.user.create({
      data: { email, name, password: hash },
      select: { id: true, email: true, name: true },
    });

    // 4) link to tenant with role (UserTenant)
    //    schema usually has a composite unique on [userId, tenantId]
    await (this.prisma as any).userTenant.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId } },
      update: { role },
      create: { userId: user.id, tenantId, role },
    });

    // 5) return minimal info + temp password if generated
    return {
      user,
      tenantId,
      role,
      tempPassword: password ? undefined : rawPw,
    };
  }
}
