import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from './permissions.service';

@Global()
@Module({
  imports: [
    ConfigModule, // for env access
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET') || 'secret',
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, PermissionsService],
  exports: [
    JwtModule,           // 👈 makes JwtService available app-wide
    PermissionsService,  // RBAC overrides
    AuthService,         // optional
  ],
})
export class AuthModule {}
