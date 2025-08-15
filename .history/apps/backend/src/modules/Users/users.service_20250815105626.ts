import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findPublicById(id: string | number) {
    return this.prisma.user.findUnique({
      where: { id: typeof id === "string" ? Number(id) : id },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true },
    });
  }
}
