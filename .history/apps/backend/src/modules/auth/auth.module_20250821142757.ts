import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from './permissions.service';  // ⬅️ add this

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, PermissionsService], // ⬅️ add
  exports: [PermissionsService], // ⬅️ important: so SettingsModule can use it
})
export class AuthModule {}
