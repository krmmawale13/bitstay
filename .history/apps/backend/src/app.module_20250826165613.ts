import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SettingsModule } from './modules/settings/settings.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { HotelsModule } from './modules/property/hotels/hotels.module';   // 👈 new
import { RoomsModule } from './modules/property/rooms/rooms.module';   
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/guards/auth.guard';

// Central place for all feature modules
const FEATURE_MODULES = [
  AuthModule,
  UsersModule,
  DashboardModule,
  CustomersModule,
  SettingsModule,
  BookingsModule,
  PropertyModule,    // 👈 Hotels + Rooms
  // ⬇️ Future modules here
  // InventoryModule,
  // SuppliersModule,
  // BarsModule,
  // PosModule,
  // ReportsModule,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    PrismaModule,
    ...FEATURE_MODULES,   // 👈 single source of truth
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
