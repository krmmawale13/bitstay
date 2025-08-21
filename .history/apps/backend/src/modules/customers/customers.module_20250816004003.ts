import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../prisma/prisma.service';

// Agar tum TenantGuard ya koi aur multi-tenant guard use kar rahe ho
// toh yahan import karke providers me add kar sakte ho
// import { TenantGuard } from '../../common/guards/tenant.guard';

@Module({
  controllers: [CustomersController],
  providers: [
    CustomersService,
    PrismaService,
    // TenantGuard // (optional) agar controller me globally guard use karna ho
  ],
  exports: [CustomersService], // taaki baaki modules me use ho sake
})
export class CustomersModule {}
