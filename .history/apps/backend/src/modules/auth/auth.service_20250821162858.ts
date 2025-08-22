import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,          // use Nest JwtService for full compatibility
  ) {}

  async login(email: string, password: string) {
    // Dynamic: try multi-tenant include first; fallback to single-tenant model
    let user: any;
    try {
      user = await this.prisma.user.findUnique({
        where: { email },
        include: { tenants: true } as any, // if relation exists (UserTenant-style)
      });
    } catch {
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

    // Normalize tenantIds for payload (handles both schemas)
    const tenantIds: number[] =
      Array.isArray((user as any)?.tenants) && (user as any).tenants.length
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

    // ✅ sign with Nest JwtService (AuthGuard.verifyAsync will match)
    const token = this.jwt.sign(tokenPayload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenants: tenantIds,           // frontend expects array
        role: (user as any).role || null,
      },
    };
  }
}
