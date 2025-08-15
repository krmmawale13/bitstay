import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    // Adjust model names: Booking, Payment, Room, Guest
    const [bookingCount, payments, roomCount, occupiedRooms, guestCount, adrRow] =
      await Promise.all([
        this.prisma.booking.count(),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: "PAID" as any }, // or adapt to your status enum/field
        }),
        this.prisma.room.count(),
        this.prisma.room.count({ where: { status: "OCCUPIED" as any } }),
        this.prisma.guest.count(),
        this.prisma.booking.aggregate({ _avg: { dailyRate: true as any } }), // adapt field
      ]);

    const totalRevenue = payments._sum.amount ?? 0;
    const occupancyRate = roomCount ? Math.round((occupiedRooms / roomCount) * 100) : 0;

    // pending payments (adapt to your logic)
    const pendingPayments = await this.prisma.payment.count({
      where: { status: "PENDING" as any },
    });

    return {
      totalBookings: bookingCount,
      totalRevenue,
      occupancyRate,
      avgDailyRate: adrRow._avg.dailyRate ?? 0,
      pendingPayments,
      activeGuests: guestCount,
    };
  }
}
