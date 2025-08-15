import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return user;
  }

  async signJwt(payload: object) {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
  }

  async getUserIdFromRequest(req: any) {
    const token = req.cookies?.["access_token"];
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return decoded?.sub ?? null;
    } catch {
      return null;
    }
  }
}
