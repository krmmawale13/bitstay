import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@Injectable()
export class HotelsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: number) {
    return this.prisma.hotel.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, tenantId: number) {
    const hotel = await this.prisma.hotel.findFirst({
      where: { id, tenantId },
    });
    if (!hotel) throw new NotFoundException('Hotel not found');
    return hotel;
  }

  async create(data: CreateHotelDto, tenantId: number) {
    return this.prisma.hotel.create({
      data: { ...data, tenantId },
    });
  }

  async update(id: number, data: UpdateHotelDto, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.prisma.hotel.update({
      where: { id },
      data,
    });
  }

  async remove(id: number, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.prisma.hotel.delete({ where: { id } });
  }

  /* -----------------------------------------------------------
   * Summary for Hotels dashboard (FE consumes directly)
   * - No FE calculations required
   * - Uses Rooms + Bookings to compute occupancy
   * ----------------------------------------------------------- */
  async getSummary(tenantId: number) {
    // Parallel fetches for speed
    const [
      totalHotels,
      totalRooms,
      cleanCount,
      dirtyCount,
      inspectCount,
      oooCount,
      perHotelRooms,
      activeBookedRoomIdsDistinct,
    ] = await Promise.all([
      this.prisma.hotel.count({ where: { tenantId } }),
      this.prisma.room.count({ where: { tenantId } }),

      // Room status buckets (Room.status is a string in schema)
      this.prisma.room.count({ where: { tenantId, status: 'CLEAN' } }),
      this.prisma.room.count({ where: { tenantId, status: 'DIRTY' } }),
      this.prisma.room.count({ where: { tenantId, status: 'INSPECT' } }),
      this.prisma.room.count({ where: { tenantId, status: 'OOO' } }),

      // Per-hotel room counts (for donut in FE)
      this.prisma.hotel.findMany({
        where: { tenantId },
        select: { id: true, name: true, _count: { select: { rooms: true } } },
        orderBy: { name: 'asc' },
      }),

      // Distinct roomIds that are currently occupied/active via bookings
      // (CONFIRMED or CHECKED_IN)
      this.prisma.bookingRoom.findMany({
        where: {
          booking: {
            tenantId,
            status: { in: ['CONFIRMED', 'CHECKED_IN'] as any[] },
          },
        },
        distinct: ['roomId'],        // Prisma will dedupe by roomId
        select: { roomId: true },
      }),
    ]);

    const activeHotels = perHotelRooms.filter(h => h._count.rooms > 0).length;
    const avgRoomsPerHotel = totalHotels > 0 ? Number((totalRooms / totalHotels).toFixed(2)) : 0;

    const occupiedRooms = activeBookedRoomIdsDistinct.length;
    const occupancyPct = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0;

    return {
      totals: {
        hotels: totalHotels,
        rooms: totalRooms,
        activeHotels,
        avgRoomsPerHotel,
      },
      roomsByStatus: {
        CLEAN: cleanCount,
        DIRTY: dirtyCount,
        INSPECT: inspectCount,
        OOO: oooCount,
      },
      occupancy: {
        occupiedRooms,
        totalRooms,
        percent: occupancyPct, // 0–100
      },
      perHotel: perHotelRooms.map(h => ({
        id: h.id,
        name: h.name,
        rooms: h._count.rooms,
      })),
      // Optional: server timestamp for cache-busting/UX
      generatedAt: new Date().toISOString(),
    };
  }
}
