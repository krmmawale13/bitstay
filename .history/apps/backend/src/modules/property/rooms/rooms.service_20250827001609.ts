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

  // -------- meta --------
  async meta(tenantId: number) {
    const [hotels, roomTypes] = await Promise.all([
      this.prisma.hotel.findMany({
        where: { tenantId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      // RoomType is global in your schema (no tenantId column)
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

  // -------- list --------
  async findAll(tenantId: number, hotelId?: number) {
    return this.prisma.room.findMany({
      where: { tenantId, ...(hotelId ? { hotelId } : {}) },
      orderBy: { id: 'desc' },
      include: {
        hotel: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
      },
    });
  }

  // -------- single --------
  async findOne(id: number, tenantId: number) {
    const room = await this.prisma.room.findFirst({
      where: { id, tenantId },
      include: {
        hotel: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
        images: true, // RoomImage[]
      },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  // -------- create --------
  async create(dto: CreateRoomDto, tenantId: number) {
    // soft unique per (hotelId, number)
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
        type: { select: { id: true, name: true } },
      },
    });

    // NOTE: amenities are linked to RoomType via roomamenity in your schema, not to Room
    // Images are added via addImages()

    return this.findOne(created.id, tenantId);
  }

  // -------- update --------
  async update(id: number, dto: UpdateRoomDto, tenantId: number) {
    const existing = await this.prisma.room.findFirst({
      where: { id, tenantId },
      select: { id: true, hotelId: true, number: true },
    });
    if (!existing) throw new NotFoundException('Room not found');

    // duplicate guard if hotelId/number change
    const nextHotelId = dto.hotelId ?? existing.hotelId;
    const nextNumber = dto.number ?? existing.number;
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

    const baseUpdate: any = {};
    if (dto.hotelId !== undefined) baseUpdate.hotelId = dto.hotelId;
    if (dto.number !== undefined) baseUpdate.number = dto.number;
    if (dto.typeId !== undefined) baseUpdate.typeId = dto.typeId ?? null;
    if (dto.rate !== undefined) baseUpdate.rate = dto.rate;
    if (dto.status !== undefined) baseUpdate.status = dto.status;

    await this.prisma.room.update({ where: { id }, data: baseUpdate });

    return this.findOne(id, tenantId);
  }

  // -------- status only --------
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

  // -------- images: add one or more --------
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
        .map((u) => ({ roomId, url: u })) ?? [];

    if (rows.length === 0) {
      throw new BadRequestException('No valid image URLs provided');
    }

    await this.prisma.roomImage.createMany({ data: rows });
    return this.findOne(roomId, tenantId);
  }

  // -------- images: delete one by image id --------
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

  // -------- images: reorder (no-op validator; no "position" in schema) --------
  async reorderImages(roomId: number, ids: number[], tenantId: number) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, tenantId },
      select: { id: true },
    });
    if (!room) throw new NotFoundException('Room not found');

    // validate that provided ids belong to this room
    const count = await this.prisma.roomImage.count({
      where: { roomId, id: { in: ids || [] } },
    });
    if ((ids || []).length > 0 && count !== ids.length) {
      throw new BadRequestException(
        'One or more image IDs do not belong to this room',
      );
    }

    // No ordering to persist (schema has no position); return the fresh room
    return this.findOne(roomId, tenantId);
  }

  // -------- delete --------
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
