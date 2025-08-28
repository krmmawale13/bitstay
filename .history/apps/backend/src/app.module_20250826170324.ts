import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SettingsModule } from './modules/settings/settings.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { HotelsModule } from './modules/property/hotels/hotels.module';
import { RoomsModule } from './modules/property/rooms/rooms.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/guards/auth.guard';

const FEATURE_MODULES = [
  AuthModule,      // 👈 contains global JwtModule
  UsersModule,
  DashboardModule,
  CustomersModule,
  SettingsModule,
  BookingsModule,
  HotelsModule,
  RoomsModule,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ...FEATURE_MODULES,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard }, // keep your global guard if you already had it
  ],
})
export class AppModule {}
