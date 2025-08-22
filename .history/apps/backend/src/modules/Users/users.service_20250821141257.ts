// apps/backend/src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleEnum } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Schema-aligned: User requires { role, tenant }.
   * Creates a user and links to the given tenant (connect).
   */
  async createUserAndAssign(params: {
    email: string;
    name: string;
    password?: string;
    tenantId: number;
    role: RoleEnum; // ADMIN | MANAGER | RECEPTIONIST | CASHIER | WAITER | HOUSEKEEPING
  }) {
    const { email, name, password, tenantId, role } = params;

    // 1) unique email check
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error('User with this email already exists');

    // 2) hash/generate password
    const rawPw = password ?? (Math.random().toString(36).slice(-8) + 'Aa1!');
    const hash = await bcrypt.hash(rawPw, 10);

    // 3) create user WITH required role + tenant relation (schema requires both)
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hash,
        role,                       // <-- REQUIRED by your schema
        tenant: { connect: { id: tenantId } }, // <-- REQUIRED relation
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
}
