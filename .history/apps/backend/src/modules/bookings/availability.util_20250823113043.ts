import { BadRequestException } from '@nestjs/common';
import { BookingStatus, PrismaClient } from '@prisma/client';

/**
 * Validate window and ordering.
 */
export function ensureDateOrder(checkIn: Date, checkOut: Date) {
  if (
    !(checkIn instanceof Date) ||
    !(checkOut instanceof Date) ||
    isNaN(checkIn.getTime()) ||
    isNaN(checkOut.getTime())
  ) {
    throw new BadRequestException('Invalid dates');
  }
  if (checkOut <= checkIn) {
    throw new BadRequestException('checkOut must be after checkIn');
  }
}

/**
 * Returns roomIds that are blocked in the given window for active bookings.
 * Overlap rule: (existing.checkIn < newCheckOut) && (existing.checkOut > newCheckIn)
 */
export async function getBlockedRoomIds(
  prisma: Pick<PrismaClient, 'bookingRoom'>,
  tenantId: number,
  checkIn: Date,
  checkOut: Date
): Promise<number[]> {
  const active: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.CHECKED_IN,
  ];

  const rows = await prisma.bookingRoom.findMany({
    where: {
      booking: {
        tenantId,
        status: { in: active },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    },
    select: { roomId: true },
    distinct: ['roomId'],
  });

  return rows.map((r) => r.roomId);
}

/**
 * Query available rooms with enriched shape (type + hotel + rate) for the window.
 * Optional hotel filter supported.
 */
export async function queryAvailableRooms(
  prisma: Pick<PrismaClient, 'room' | 'bookingRoom'>,
  args: {
    tenantId: number;
    checkIn: Date;
    checkOut: Date;
    hotelId?: number;
  }
) {
  const { tenantId, checkIn, checkOut, hotelId } = args;

  const blockedIds = await getBlockedRoomIds(prisma, tenantId, checkIn, checkOut);

  const rooms = await prisma.room.findMany({
    where: {
      tenantId,
      ...(hotelId ? { hotelId } : {}),
      ...(blockedIds.length ? { id: { notIn: blockedIds } } : {}),
    },
    orderBy: { number: 'asc' },
    include: {
      type: { select: { id: true, name: true } },
      hotel: { select: { id: true, name: true } },
    },
  });

  return rooms;
}
