import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from '../auth/permissions.service';
import { AuthModule } from '../auth/auth.module'; 

@Module({
  imports: [AuthModule], 
  controllers: [BookingsController],
  providers: [PrismaService, PermissionsService, BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
