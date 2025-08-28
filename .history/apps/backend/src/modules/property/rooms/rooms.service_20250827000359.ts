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
      // RoomType is global (no tenantId field in your schema)
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
        images: true, // OK: Room -> RoomImage[]
        // ❌ no include of roomamenity here; that relation is on RoomType
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

    const { ...base } = dto;

    const created = await this.prisma.room.create({
      data: {
        tenantId,
        hotelId: base.hotelId,
        number: base.number,
        typeId: base.typeId ?? null,
        rate: base.rate,
        status: base.status,
      },
      include: {
        hotel: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
      },
    });

    // NOTE: Amenities are managed at RoomType level in current schema.
    // Images can be attached in a separate endpoint or via update() below if you add images array there.

    return this.findOne(created.id, tenantId);
  }

  // -------- update --------
  async update(id: number, dto: UpdateRoomDto, tenantId: number) {
    const existing = await this.prisma.room.findFirst({
      where: { id, tenantId },
      select: { id: true, hotelId: true, number: true },
    });
    if (!existing) throw new NotFoundException('Room not found');

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

  // -------- delete --------
  async remove(id: number, tenantId: number) {
    const existing = await this.prisma.room.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Room not found');

    await this.prisma.$transaction([
      this.prisma.roomImage.deleteMany({ where: { roomId: id } }),
      // ❌ no roomamenity delete here (there is no roomId field on that table)
      this.prisma.room.delete({ where: { id } }),
    ]);

    return { success: true };
  }
}
