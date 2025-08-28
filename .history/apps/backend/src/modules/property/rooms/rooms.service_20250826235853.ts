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

  /* ---------- meta (hotels + roomTypes + statuses) ---------- */
  async meta(tenantId: number) {
    const [hotels, roomTypes] = await Promise.all([
      this.prisma.hotel.findMany({
        where: { tenantId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      // RoomType DOES NOT have tenantId in your schema → don't filter by tenant
      this.prisma.roomType
        ? this.prisma.roomType.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([] as Array<{ id: number; name: string }>),
    ]);

    const statuses: Array<'CLEAN' | 'DIRTY' | 'INSPECT' | 'OOO'> = [
      'CLEAN',
      'DIRTY',
      'INSPECT',
      'OOO',
    ];

    return { hotels, roomTypes, statuses };
  }

  /* ---------- list with optional hotel filter ---------- */
  async findAll(tenantId: number, hotelId?: number) {
    return this.prisma.room.findMany({
      where: {
        tenantId,
        ...(hotelId ? { hotelId } : {}),
      },
      orderBy: { id: 'desc' },
      include: {
        hotel: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
      },
    });
  }

  /* ---------- single ---------- */
  async findOne(id: number, tenantId: number) {
    const room = await this.prisma.room.findFirst({
      where: { id, tenantId },
      include: {
        hotel: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
        images: true, // Model RoomImage -> relation field is "images" on Room (as you already had)
        // IMPORTANT: Generated name is "roomamenity", not "roomAmenity"
        roomamenity: {
          include: {
            amenity: { select: { id: true, name: true, icon: true } },
          },
        },
      },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  /* ---------- create (with soft-unique & relations) ---------- */
  async create(dto: CreateRoomDto, tenantId: number) {
    // unique per hotel: (hotelId, number)
    const dup = await this.prisma.room.findFirst({
      where: { tenantId, hotelId: dto.hotelId, number: dto.number },
      select: { id: true },
    });
    if (dup) {
      throw new BadRequestException(
        'A room with this number already exists in this hotel',
      );
    }

    const { amenityIds, images, ...base } = dto;

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

    // attach relations
    if (amenityIds?.length) {
      await this.prisma.roomamenity.createMany({
        data: amenityIds.map((amenityId) => ({ roomId: created.id, amenityId })),
        skipDuplicates: true,
      });
    }
    if (images?.length) {
      await this.prisma.roomImage.createMany({
        data: images.map((url) => ({ roomId: created.id, url })),
      });
    }

    return this.findOne(created.id, tenantId);
  }

  /* ---------- update (with soft-unique, replace relations) ---------- */
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

    const { amenityIds, images, ...rest } = dto;

    const baseUpdate: any = {};
    if (rest.hotelId !== undefined) baseUpdate.hotelId = rest.hotelId;
    if (rest.number !== undefined) baseUpdate.number = rest.number;
    if (rest.typeId !== undefined) baseUpdate.typeId = rest.typeId ?? null;
    if (rest.rate !== undefined) baseUpdate.rate = rest.rate;
    if (rest.status !== undefined) baseUpdate.status = rest.status;

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(baseUpdate).length > 0) {
        await tx.room.update({ where: { id }, data: baseUpdate });
      }

      if (amenityIds) {
        await tx.roomamenity.deleteMany({ where: { roomId: id } });
        if (amenityIds.length) {
          await tx.roomamenity.createMany({
            data: amenityIds.map((amenityId) => ({ roomId: id, amenityId })),
            skipDuplicates: true,
          });
        }
      }

      if (images) {
        await tx.roomImage.deleteMany({ where: { roomId: id } });
        if (images.length) {
          await tx.roomImage.createMany({
            data: images.map((url) => ({ roomId: id, url })),
          });
        }
      }
    });

    return this.findOne(id, tenantId);
  }

  /* ---------- update only status ---------- */
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

  /* ---------- delete ---------- */
  async remove(id: number, tenantId: number) {
    const existing = await this.prisma.room.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Room not found');

    await this.prisma.$transaction([
      this.prisma.roomImage.deleteMany({ where: { roomId: id } }),
      this.prisma.roomamenity.deleteMany({ where: { roomId: id } }),
      this.prisma.room.delete({ where: { id } }),
    ]);

    return { success: true };
  }
}
