import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(email: string, password: string) {
    // Try to include tenants relation dynamically
    let user;
    try {
      user = await this.prisma.user.findUnique({
        where: { email },
        include: { tenants: true } as any, // force include even if TS complains
      });
    } catch (err) {
      // Fallback: if tenants relation doesn't exist in schema
      user = await this.prisma.user.findUnique({
        where: { email },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Normalize tenants array for payload
    const tenantIds = (user as any).tenants
      ? (user as any).tenants.map((ut: any) => ut.tenantId)
      : user.tenantId
      ? [user.tenantId]
      : [];

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      tenantIds,
      role: (user as any).role || null,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1d',
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenants: tenantIds,
        role: (user as any).role || null,
      },
    };
  }
}
