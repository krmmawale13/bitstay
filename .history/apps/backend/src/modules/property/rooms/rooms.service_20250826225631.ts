import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async findMany(tenantId: number, hotelId?: number) {
    return this.prisma.room.findMany({
      where: { tenantId, ...(hotelId ? { hotelId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        hotel: { select: { id: true, name: true } },
        type:  { select: { id: true, name: true } },
        // NEW: bring amenities for lists if you want
        amenities: { select: { amenity: { select: { id: true, name: true } } } },
      },
    });
  }

  async findOne(id: number, tenantId: number) {
    const room = await this.prisma.room.findFirst({
      where: { id, tenantId },
      include: {
        hotel: { select: { id: true, name: true } },
        type:  { select: { id: true, name: true } },
        amenities: { select: { amenity: { select: { id: true, name: true } } } }, // NEW
      },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  // helper: duplicate guard without schema change
  private async ensureUniqueNumber(hotelId: number, number: string, tenantId: number, excludeId?: number) {
    const existing = await this.prisma.room.findFirst({
      where: {
        tenantId,
        hotelId,
        number,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) throw new ConflictException('A room with this number already exists in this hotel');
  }

  async create(dto: CreateRoomDto, tenantId: number) {
    await this.ensureUniqueNumber(dto.hotelId, dto.number, tenantId);

    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          hotelId: dto.hotelId,
          number: dto.number,
          typeId: dto.typeId,
          rate: dto.rate,
          status: dto.status ?? 'CLEAN',
          tenantId,
        },
      });

      if (dto.amenityIds?.length) {
        // assuming RoomAmenity junction: roomamenity(roomId, amenityId)
        await tx.roomAmenity.createMany({
          data: dto.amenityIds.map((amenityId) => ({ roomId: room.id, amenityId })),
          skipDuplicates: true,
        });
      }

      return room;
    });
  }

  async update(id: number, dto: UpdateRoomDto, tenantId: number) {
    const current = await this.findOne(id, tenantId);

    if (dto.hotelId || dto.number) {
      await this.ensureUniqueNumber(
        dto.hotelId ?? current.hotelId,
        dto.number ?? current.number,
        tenantId,
        id
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.room.update({
        where: { id },
        data: {
          hotelId: dto.hotelId ?? undefined,
          number: dto.number ?? undefined,
          typeId: dto.typeId ?? undefined,
          rate: dto.rate ?? undefined,
          status: dto.status ?? undefined,
        },
      });

      if (dto.amenityIds) {
        // replace amenities
        await tx.roomAmenity.deleteMany({ where: { roomId: id } });
        if (dto.amenityIds.length) {
          await tx.roomAmenity.createMany({
            data: dto.amenityIds.map((amenityId) => ({ roomId: id, amenityId })),
            skipDuplicates: true,
          });
        }
      }

      return updated;
    });
  }

  async remove(id: number, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.prisma.$transaction(async (tx) => {
      await tx.roomAmenity.deleteMany({ where: { roomId: id } });
      return tx.room.delete({ where: { id } });
    });
  }

  // meta now includes amenities
  async meta(tenantId: number) {
    const [hotels, roomTypes, amenities] = await Promise.all([
      this.prisma.hotel.findMany({ where: { tenantId }, select: { id: true, name: true } }),
      this.prisma.roomType.findMany({ where: { tenantId }, select: { id: true, name: true } }),
      this.prisma.amenity.findMany({ where: { tenantId }, select: { id: true, name: true } }),
    ]);
    return {
      hotels,
      roomTypes,
      statuses: ['CLEAN', 'DIRTY', 'INSPECT', 'OOO'] as const,
      amenities, // NEW
    };
  }
}
