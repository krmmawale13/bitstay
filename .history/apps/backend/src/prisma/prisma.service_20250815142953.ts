import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Optional: handle process shutdown
  enableShutdownHooks(app: any) {
    this.$on<any>('beforeExit', async () => { // 👈 force typing if TS complains
      await app.close();
    });
  }
}
