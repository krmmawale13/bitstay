import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateRoomStatusDto } from './dto/update-room-status.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: number, hotelId?: number) {
    return this.prisma.room.findMany({
      where: {
        tenantId,
        ...(hotelId ? { hotelId } : {}),
      },
      include: { hotel: true, type: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, tenantId: number) {
    const room = await this.prisma.room.findFirst({
      where: { id, tenantId },
      include: { hotel: true, type: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async create(data: CreateRoomDto, tenantId: number) {
    return this.prisma.room.create({
      data: {
        ...data,
        tenantId,
        status: data.status ?? 'CLEAN',
      },
    });
  }

  async update(id: number, data: UpdateRoomDto, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.prisma.room.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: number, data: UpdateRoomStatusDto, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.prisma.room.update({
      where: { id },
      data: { status: data.status },
    });
  }

  async remove(id: number, tenantId: number) {
    await this.findOne(id, tenantId);
    return this.prisma.room.delete({ where: { id } });
  }

  /* --------------------------- NEW: /rooms/meta --------------------------- */
  async meta(tenantId: number) {
    const [hotels, roomTypes] = await Promise.all([
      this.prisma.hotel.findMany({
        where: { tenantId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      // RoomType is global in schema (no tenantId)
      this.prisma.roomType.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const statuses = ['CLEAN', 'DIRTY', 'INSPECT', 'OOO'] as const;

    return { hotels, roomTypes, statuses };
  }
}
