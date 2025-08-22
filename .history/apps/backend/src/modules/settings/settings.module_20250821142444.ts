import { Module } from '@nestjs/common';
import { AccessController } from './access.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module'; // to use PermissionsService

@Module({
  imports: [AuthModule],
  controllers: [AccessController],
  providers: [PrismaService],
})
export class SettingsModule {}
