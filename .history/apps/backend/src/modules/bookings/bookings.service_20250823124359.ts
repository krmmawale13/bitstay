import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, BookingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AllocateRoomDto } from './dto/allocate-room.dto';
import { AddGuestDto } from './dto/add-guest.dto';
import { AddChargeDto } from './dto/add-charge.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { ensureDateOrder, queryAvailableRooms } from './availability.util';
import { assertStatusTransition } from './booking.status.util';

type ListParams = {
  from?: string;
  to?: string;
  status?: BookingStatus;
  customerId?: number;
  roomId?: number;
  sourceId?: number;
  skip?: number;
  take?: number;
};

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Helpers ----------
  /** kept for parity with your earlier checks (still used in create/update) */
  private ensureDateOrder(checkIn: Date, checkOut: Date) {
    // delegate to shared util (throws identical errors)
    return ensureDateOrder(checkIn, checkOut);
  }

  /** centralized transition rule (throws 400 on invalid) */
  private assertStatusTransition(from: BookingStatus, to: BookingStatus) {
    return assertStatusTransition(from, to);
  }

  private async assertRoomAvailable(
    tenantId: number,
    roomId: number,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: number
  ) {
    const activeStatuses: BookingStatus[] = [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.CHECKED_IN,
    ];
    const overlapping = await this.prisma.bookingRoom.findFirst({
      where: {
        roomId,
        booking: {
          tenantId,
          status: { in: activeStatuses },
          // overlap: (existing.checkIn < newCheckOut) && (existing.checkOut > newCheckIn)
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
          ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        },
      },
      select: { id: true, bookingId: true },
    });
    if (overlapping) {
      throw new BadRequestException('Room not available in selected window');
    }
  }

  // ---------- Queries ----------
  async list(params: ListParams, tenantId: number) {
    const { from, to, status, customerId, roomId, sourceId, skip = 0, take = 20 } = params;

    const where: Prisma.BookingWhereInput = {
      tenantId,
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(sourceId ? { sourceId } : {}),
      ...(from || to
        ? {
            AND: [
              from ? { checkIn: { gte: new Date(from) } } : {},
              to ? { checkOut: { lte: new Date(to) } } : {},
            ],
          }
        : {}),
      ...(roomId
        ? {
            rooms: {
              some: { roomId },
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          customer: true,
          source: true,
          rooms: {
            include: {
              room: { include: { hotel: true, type: true } }, // enriched for UI (number/rate/type/hotel)
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async get(id: number, tenantId: number) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        source: true,
        guests: { include: { idType: true } }, // include idType for UI
        rooms: { include: { room: { include: { hotel: true, type: true } } } },
        payments: { include: { mode: true } },
        bookingcharge: true,
        roomAllocationHistory: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  // ---------- Mutations ----------
  async create(dto: CreateBookingDto, tenantId: number) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    this.ensureDateOrder(checkIn, checkOut);

    // room availability checks (if rooms provided)
    if (dto.rooms?.length) {
      for (const roomId of dto.rooms) {
        await this.assertRoomAvailable(tenantId, roomId, checkIn, checkOut);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          tenantId,
          customerId: dto.customerId,
          sourceId: dto.sourceId ?? null,
          checkIn,
          checkOut,
          status: 'PENDING',
          rooms: dto.rooms?.length
            ? {
                create: dto.rooms.map((roomId) => ({ roomId })),
              }
            : undefined,
          guests: dto.guests?.length
            ? {
                create: dto.guests.map((g) => ({
                  name: g.name,
                  // gender not present on BookingGuest schema → not persisted
                  idTypeId: g.idTypeId ?? null,
                  idNumber: g.idNumber ?? null,
                })),
              }
            : undefined,
        },
      });

      return created;
    });
  }

  async update(id: number, dto: UpdateBookingDto, tenantId: number) {
    const booking = await this.prisma.booking.findFirst({ where: { id, tenantId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const next: Prisma.BookingUpdateInput = {};

    if (dto.checkIn || dto.checkOut) {
      const checkIn = new Date(dto.checkIn ?? booking.checkIn);
      const checkOut = new Date(dto.checkOut ?? booking.checkOut);
      this.ensureDateOrder(checkIn, checkOut);
      next.checkIn = checkIn;
      next.checkOut = checkOut;

      // re-check availability for allocated rooms
      const rooms = await this.prisma.bookingRoom.findMany({ where: { bookingId: id } });
      for (const br of rooms) {
        await this.assertRoomAvailable(tenantId, br.roomId, checkIn, checkOut, id);
      }
    }

    if (typeof dto.sourceId !== 'undefined') {
      next.source = dto.sourceId ? { connect: { id: dto.sourceId } } : { disconnect: true };
    }

    return this.prisma.booking.update({
      where: { id },
      data: next,
    });
  }

  async allocateRoom(id: number, dto: AllocateRoomDto, tenantId: number) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, tenantId },
      include: { rooms: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // check availability for target room
    await this.assertRoomAvailable(tenantId, dto.newRoomId, booking.checkIn, booking.checkOut, booking.id);

    // strategy: if booking has a room, replace the most recent; else add one
    const old = booking.rooms.at(-1) ?? booking.rooms[0];

    return this.prisma.$transaction(async (tx) => {
      if (old) {
        // replace: delete old link and add new link
        await tx.bookingRoom.delete({ where: { id: old.id } });
        await tx.bookingRoom.create({ data: { bookingId: booking.id, roomId: dto.newRoomId } });
        await tx.roomAllocationHistory.create({
          data: {
            bookingId: booking.id,
            oldRoomId: old.roomId,
            newRoomId: dto.newRoomId,
          },
        });
      } else {
        // no previous room: just add
        await tx.bookingRoom.create({ data: { bookingId: booking.id, roomId: dto.newRoomId } });
        await tx.roomAllocationHistory.create({
          data: {
            bookingId: booking.id,
            oldRoomId: null,
            newRoomId: dto.newRoomId,
          },
        });
      }

      return { ok: true };
    });
  }

  async addGuests(id: number, dto: AddGuestDto, tenantId: number) {
    const booking = await this.prisma.booking.findFirst({ where: { id, tenantId } });
    if (!booking) throw new NotFoundException('Booking not found');

    await this.prisma.bookingGuest.createMany({
      data: dto.guests.map((g) => ({
        bookingId: id,
        name: g.name,
        idTypeId: g.idTypeId ?? null,
        idNumber: g.idNumber ?? null,
      })),
    });

    return { ok: true };
  }

  async addCharge(id: number, dto: AddChargeDto, tenantId: number) {
    const booking = await this.prisma.booking.findFirst({ where: { id, tenantId } });
    if (!booking) throw new NotFoundException('Booking not found');

    await this.prisma.bookingcharge.create({
      data: {
        bookingId: id,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        taxAmount: new Prisma.Decimal(dto.taxAmount ?? 0),
      },
    });
    return { ok: true };
  }

  async addPayment(id: number, dto: AddPaymentDto, tenantId: number) {
    const booking = await this.prisma.booking.findFirst({ where: { id, tenantId } });
    if (!booking) throw new NotFoundException('Booking not found');

    await this.prisma.bookingPayment.create({
      data: {
        bookingId: id,
        amount: new Prisma.Decimal(dto.amount),
        modeId: dto.modeId ?? null,
      },
    });
    return { ok: true };
  }

  async checkIn(id: number, tenantId: number) {
    const booking = await this.prisma.booking.findFirst({ where: { id, tenantId } });
    if (!booking) throw new NotFoundException('Booking not found');
    this.assertStatusTransition(booking.status, BookingStatus.CHECKED_IN);

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CHECKED_IN },
    });
  }

  async checkOut(id: number, tenantId: number) {
    const booking = await this.prisma.booking.findFirst({ where: { id, tenantId } });
    if (!booking) throw new NotFoundException('Booking not found');
    this.assertStatusTransition(booking.status, BookingStatus.CHECKED_OUT);

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CHECKED_OUT },
    });
  }

  async cancel(id: number, tenantId: number) {
    const booking = await this.prisma.booking.findFirst({ where: { id, tenantId } });
    if (!booking) throw new NotFoundException('Booking not found');
    this.assertStatusTransition(booking.status, BookingStatus.CANCELLED);

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });
  }

  // ---------- Meta ----------
  async getMeta(tenantId: number) {
    const [sources, modes, idTypes] = await this.prisma.$transaction([
      this.prisma.bookingSource.findMany(),
      this.prisma.paymentMode.findMany(),
      this.prisma.idType.findMany({ select: { id: true, name: true } }),
    ]);
    // FE expects idTypes for Guest editor; sources + paymentModes for future use
    return { sources, paymentModes: modes, idTypes };
  }

  async availability(params: { checkIn: string; checkOut: string; hotelId?: number }, tenantId: number) {
    const checkIn = new Date(params.checkIn);
    const checkOut = new Date(params.checkOut);
    ensureDateOrder(checkIn, checkOut);

    const rooms = await queryAvailableRooms(this.prisma, {
      tenantId,
      checkIn,
      checkOut,
      hotelId: params.hotelId,
    });

    // FE expects enriched: number, rate, type{name}, hotel{name}
    return { rooms };
  }
}
