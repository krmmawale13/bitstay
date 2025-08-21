import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private fallbackTenant(tenantId?: number) {
    return Number(tenantId ?? process.env.DEFAULT_TENANT_ID ?? 1);
  }

  private todayRange() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /** Executive summary for today (tenant-scoped). */
  async getSummary(tenantId?: number) {
    const tid = this.fallbackTenant(tenantId);
    const { start, end } = this.todayRange();

    try {
      // Bookings today (created OR check-in today) — we’ll use check-in focus
      const bookingsToday = await this.prisma.booking.count({
        where: {
          tenantId: tid,
          checkIn: { gte: start, lte: end },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
        },
      });

      // Occupancy: distinct rooms allocated today for overlapping stays
      const overlappingBookings = await this.prisma.booking.findMany({
        where: {
          tenantId: tid,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
          // stay overlaps with "today"
          checkIn: { lte: end },
          checkOut: { gte: start },
        },
        select: { id: true },
      });
      const bookingIds = overlappingBookings.map((b) => b.id);

      let occupiedRooms = 0;
      if (bookingIds.length > 0) {
        const bookingRooms = await this.prisma.bookingRoom.findMany({
          where: { bookingId: { in: bookingIds } },
          select: { roomId: true },
        });
        const uniq = new Set(bookingRooms.map((r) => r.roomId));
        occupiedRooms = uniq.size;
      }

      const totalRooms = await this.prisma.room.count({ where: { tenantId: tid } });
      const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      // Revenue today (Rooms via Invoice, POS via PosOrder)
      const roomsRevenueAgg = await this.prisma.invoice.aggregate({
        where: {
          tenantId: tid,
          createdAt: { gte: start, lte: end },
          status: { not: InvoiceStatus.CANCELLED },
        },
        _sum: { totalAmount: true },
      });
      const roomsRevenue = Number(roomsRevenueAgg._sum.totalAmount ?? 0);

      const posRevenueAgg = await this.prisma.posOrder.aggregate({
        where: {
          tenantId: tid,
          createdAt: { gte: start, lte: end },
        },
        _sum: { totalAmount: true },
      });
      const posRevenue = Number(posRevenueAgg._sum.totalAmount ?? 0);

      // Cash collected today (payments)
      const cashCollectedAgg = await this.prisma.payment.aggregate({
        where: {
          invoice: { tenantId: tid },
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });
      const cashCollectedToday = Number(cashCollectedAgg._sum.amount ?? 0);

      // Due today ops
      const checkinsDue = await this.prisma.booking.count({
        where: {
          tenantId: tid,
          status: BookingStatus.CONFIRMED,
          checkIn: { gte: start, lte: end },
        },
      });

      const checkoutsDue = await this.prisma.booking.count({
        where: {
          tenantId: tid,
          status: BookingStatus.CHECKED_IN,
          checkOut: { gte: start, lte: end },
        },
      });

      // Invoices due (no dueDate field; treat as not PAID and not CANCELLED)
      const invoicesDue = await this.prisma.invoice.count({
        where: {
          tenantId: tid,
          status: { notIn: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] },
        },
      });

      // Licenses expiring in 30 days
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      const licensesExpiring30d = await this.prisma.license.count({
        where: { expiryDate: { lte: in30 } },
      });

      // Low stock items — needs policy; return 0 to avoid wrong logic now
      const lowStockItems = 0;

      return {
        bookingsToday,
        occupancyPct,
        rooms: {
          occupiedRooms,
          totalRooms,
        },
        revenueToday: {
          rooms: roomsRevenue,
          pos: posRevenue,
          total: roomsRevenue + posRevenue,
        },
        cashCollectedToday,
        ops: {
          checkinsDue,
          checkoutsDue,
        },
        risks: {
          invoicesDue,
          licensesExpiring30d,
          lowStockItems,
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Dashboard summary error:', err);
      throw new InternalServerErrorException('Failed to compute dashboard summary');
    }
  }

  /** Last 7 days revenue: Rooms (Invoice) vs POS (PosOrder). */
  async getRevenue7d(tenantId?: number) {
    const tid = this.fallbackTenant(tenantId);
    const out: Array<{ date: string; rooms: number; pos: number }> = [];

    try {
      // Build 7-day window: oldest → today
      const days: Date[] = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d);
      }

      for (const d of days) {
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(d);   end.setHours(23, 59, 59, 999);

        const invAgg = await this.prisma.invoice.aggregate({
          where: {
            tenantId: tid,
            createdAt: { gte: start, lte: end },
            status: { not: 'CANCELLED' as InvoiceStatus },
          },
          _sum: { totalAmount: true },
        });

        const posAgg = await this.prisma.posOrder.aggregate({
          where: {
            tenantId: tid,
            createdAt: { gte: start, lte: end },
          },
          _sum: { totalAmount: true },
        });

        out.push({
          date: start.toISOString().slice(0, 10),
          rooms: Number(invAgg._sum.totalAmount ?? 0),
          pos: Number(posAgg._sum.totalAmount ?? 0),
        });
      }

      return { days: out };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Revenue 7d error:', err);
      throw new InternalServerErrorException('Failed to compute revenue series');
    }
  }

  /** Today’s booking mix by status (counts). */
  async getBookingMixToday(tenantId?: number) {
    const tid = this.fallbackTenant(tenantId);
    const { start, end } = this.todayRange();

    try {
      const statuses: BookingStatus[] = [
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        BookingStatus.CHECKED_IN,
        BookingStatus.CHECKED_OUT,
        BookingStatus.CANCELLED,
      ];

      const counts = await Promise.all(
        statuses.map((s) =>
          this.prisma.booking.count({
            where: {
              tenantId: tid,
              checkIn: { gte: start, lte: end },
              status: s,
            },
          }),
        ),
      );

      return statuses.map((s, i) => ({ status: s, count: counts[i] }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Booking mix error:', err);
      throw new InternalServerErrorException('Failed to compute booking mix');
    }
  }
}
