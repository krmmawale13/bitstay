import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateRoomStatusDto } from './dto/update-room-status.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  /* ==================== META (for create/edit forms) ==================== */
  async meta(tenantId: number) {
    const [hotels, roomTypes] = await Promise.all([
      this.prisma.hotel.findMany({
        where: { tenantId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      // RoomType is global (no tenantId in your schema)
      this.prisma.roomType.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const statuses: Array<'CLEAN' | 'DIRTY' | 'INSPECT' | 'OOO'> = [
      'CLEAN',
      'DIRTY',
      'INSPECT',
      'OOO',
    ];

    return { hotels, roomTypes, statuses };
  }

  /* ========================== LIST ROOMS ========================== */
  async findAll(tenantId: number, hotelId?: number) {
    return this.prisma.room.findMany({
      where: { tenantId, ...(hotelId ? { hotelId } : {}) },
      orderBy: { id: 'desc' },
      include: {
        hotel: { select: { id: true, name: true } },
        type:  { select: { id: true, name: true } },
      },
    });
  }

  /* ========================== GET ONE ROOM ========================== */
  async findOne(id: number, tenantId: number) {
    const room = await this.prisma.room.findFirst({
      where: { id, tenantId },
      include: {
        hotel:  { select: { id: true, name: true } },
        // pull RoomType and its amenities -> amenity (derived, read-only for Room)
        type: {
          select: {
            id: true,
            name: true,
            roomamenity: {
              select: {
                amenity: { select: { id: true, name: true, icon: true } },
              },
            },
          },
        },
        images: true, // RoomImage[]
      },
    });

    if (!room) throw new NotFoundException('Room not found');

    // Derive a flat amenities array (no schema change)
    const amenities =
      room.type?.roomamenity?.map((ra) => ra.amenity)?.filter(Boolean) ?? [];

    // Return the room with a computed `amenities` field (non-persistent)
    return {
      ...room,
      amenities,
    };
  }

  /* ========================== CREATE ROOM ========================== */
  async create(dto: CreateRoomDto, tenantId: number) {
    // soft-unique guard per (hotelId, number)
    const dup = await this.prisma.room.findFirst({
      where: { tenantId, hotelId: dto.hotelId, number: dto.number },
      select: { id: true },
    });
    if (dup) {
      throw new BadRequestException(
        'A room with this number already exists in this hotel',
      );
    }

    const created = await this.prisma.room.create({
      data: {
        tenantId,
        hotelId: dto.hotelId,
        number: dto.number,
        typeId: dto.typeId ?? null,
        rate: dto.rate,
        status: dto.status,
      },
      include: {
        hotel: { select: { id: true, name: true } },
        type:  { select: { id: true, name: true } },
      },
    });

    // Amenities are tied to RoomType (roomamenity), not Room — nothing to do here.
    // Images can be added via addImages() endpoint after creation.

    return this.findOne(created.id, tenantId);
  }

  /* ========================== UPDATE ROOM ========================== */
  async update(id: number, dto: UpdateRoomDto, tenantId: number) {
    const existing = await this.prisma.room.findFirst({
      where: { id, tenantId },
      select: { id: true, hotelId: true, number: true },
    });
    if (!existing) throw new NotFoundException('Room not found');

    // duplicate guard if (hotelId, number) pair would change
    const nextHotelId = dto.hotelId ?? existing.hotelId;
    const nextNumber  = dto.number  ?? existing.number;
    if (nextHotelId !== existing.hotelId || nextNumber !== existing.number) {
      const dup = await this.prisma.room.findFirst({
        where: {
          tenantId,
          hotelId: nextHotelId,
          number: nextNumber,
          NOT: { id },
        },
        select: { id: true },
      });
      if (dup) {
        throw new BadRequestException(
          'A room with this number already exists in this hotel',
        );
      }
    }

    const data: any = {};
    if (dto.hotelId !== undefined) data.hotelId = dto.hotelId;
    if (dto.number  !== undefined) data.number  = dto.number;
    if (dto.typeId  !== undefined) data.typeId  = dto.typeId ?? null;
    if (dto.rate    !== undefined) data.rate    = dto.rate;
    if (dto.status  !== undefined) data.status  = dto.status;

    await this.prisma.room.update({ where: { id }, data });

    // Returning full room with derived amenities & images
    return this.findOne(id, tenantId);
  }

  /* ======================= UPDATE STATUS ONLY ======================= */
  async updateStatus(id: number, dto: UpdateRoomStatusDto, tenantId: number) {
    const existing = await this.prisma.room.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Room not found');

    await this.prisma.room.update({
      where: { id },
      data: { status: dto.status },
    });

    return this.findOne(id, tenantId);
  }

  /* ========================== ROOM IMAGES ========================== */

  // Add one or more image URLs to a room
  async addImages(roomId: number, urls: string[], tenantId: number) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, tenantId },
      select: { id: true },
    });
    if (!room) throw new NotFoundException('Room not found');

    const rows =
      (urls || [])
        .map((u) => String(u || '').trim())
        .filter((u) => u.length > 0)
        .map((u) => ({ roomId, url: u }));

    if (rows.length === 0) {
      throw new BadRequestException('No valid image URLs provided');
    }

    await this.prisma.roomImage.createMany({ data: rows });
    return this.findOne(roomId, tenantId);
  }

  // Delete a single image by its image id
  async removeImage(roomId: number, imageId: number, tenantId: number) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, tenantId },
      select: { id: true },
    });
    if (!room) throw new NotFoundException('Room not found');

    const img = await this.prisma.roomImage.findFirst({
      where: { id: imageId, roomId },
      select: { id: true },
    });
    if (!img) throw new NotFoundException('Image not found');

    await this.prisma.roomImage.delete({ where: { id: imageId } });
    return this.findOne(roomId, tenantId);
  }

  // Reorder images: your schema has no position field, so we only validate ownership and return fresh room
  async reorderImages(roomId: number, ids: number[], tenantId: number) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, tenantId },
      select: { id: true },
    });
    if (!room) throw new NotFoundException('Room not found');

    // Ensure all provided IDs belong to this room
    const count = await this.prisma.roomImage.count({
      where: { roomId, id: { in: ids || [] } },
    });
    if ((ids || []).length > 0 && count !== ids.length) {
      throw new BadRequestException(
        'One or more image IDs do not belong to this room',
      );
    }

    // Nothing to persist (no position); return a fresh snapshot
    return this.findOne(roomId, tenantId);
  }

  /* ========================== HELPERS ========================== */

  // If you ever need *just* the derived amenities for a room
  async derivedAmenities(roomId: number, tenantId: number) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, tenantId },
      select: {
        type: {
          select: {
            roomamenity: {
              select: {
                amenity: { select: { id: true, name: true, icon: true } },
              },
            },
          },
        },
      },
    });
    if (!room) throw new NotFoundException('Room not found');

    return (
      room.type?.roomamenity?.map((ra) => ra.amenity).filter(Boolean) ?? []
    );
  }

  /* ========================== DELETE ROOM ========================== */
  async remove(id: number, tenantId: number) {
    const existing = await this.prisma.room.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Room not found');

    await this.prisma.$transaction([
      this.prisma.roomImage.deleteMany({ where: { roomId: id } }),
      this.prisma.room.delete({ where: { id } }),
    ]);

    return { success: true };
  }
}
