// src/modules/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, PrismaService],
  exports: [CustomersService], // allow use in other modules (e.g., Invoices/Bookings)
})
export class CustomersModule {}
