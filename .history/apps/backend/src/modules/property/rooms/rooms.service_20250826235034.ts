import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// ... your other imports

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  // ... other methods

  async create(dto: CreateRoomDto, tenantId: number) {
    // 1) soft uniqueness: (hotelId, number)
    const dup = await this.prisma.room.findFirst({
      where: { tenantId, hotelId: dto.hotelId, number: dto.number },
      select: { id: true },
    });
    if (dup) {
      throw new BadRequestException('A room with this number already exists in this hotel');
    }

    // 2) split DTO
    const { amenityIds, images, ...base } = dto;

    // 3) create base room first
    const room = await this.prisma.room.create({
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

    // 4) attach amenities & images (optional)
    if (amenityIds?.length) {
      await this.prisma.roomAmenity.createMany({
        data: amenityIds.map((amenityId) => ({ roomId: room.id, amenityId })),
        skipDuplicates: true,
      });
    }

    if (images?.length) {
      await this.prisma.roomImage.createMany({
        data: images.map((url) => ({ roomId: room.id, url })),
      });
    }

    // 5) return enriched room
    return this.prisma.room.findUnique({
      where: { id: room.id },
      include: {
        hotel: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
        // if you want to send images/amenities now:
        images: true,
        roomAmenity: { include: { amenity: { select: { id: true, name: true, icon: true } } } },
      },
    });
  }

  async update(id: number, dto: UpdateRoomDto, tenantId: number) {
    // ensure room exists + belongs to tenant
    const existing = await this.prisma.room.findFirst({
      where: { id, tenantId },
      select: { id: true, hotelId: true, number: true },
    });
    if (!existing) throw new NotFoundException('Room not found');

    // uniqueness check only if (hotelId or number) is changing
    const nextHotelId = dto.hotelId ?? existing.hotelId;
    const nextNumber = dto.number ?? existing.number;
    if (nextHotelId !== existing.hotelId || nextNumber !== existing.number) {
      const dup = await this.prisma.room.findFirst({
        where: { tenantId, hotelId: nextHotelId, number: nextNumber, NOT: { id } },
        select: { id: true },
      });
      if (dup) {
        throw new BadRequestException('A room with this number already exists in this hotel');
      }
    }

    // prepare base update (only defined keys)
    const baseUpdate: any = {};
    if (dto.hotelId !== undefined) baseUpdate.hotelId = dto.hotelId;
    if (dto.number !== undefined)  baseUpdate.number  = dto.number;
    if (dto.typeId !== undefined)  baseUpdate.typeId  = dto.typeId ?? null;
    if (dto.rate !== undefined)    baseUpdate.rate    = dto.rate;
    if (dto.status !== undefined)  baseUpdate.status  = dto.status;

    // run everything in a transaction
    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(baseUpdate).length > 0) {
        await tx.room.update({
          where: { id },
          data: baseUpdate,
        });
      }

      // replace amenities if provided
      if (dto.amenityIds) {
        await tx.roomAmenity.deleteMany({ where: { roomId: id } });
        if (dto.amenityIds.length) {
          await tx.roomAmenity.createMany({
            data: dto.amenityIds.map((amenityId) => ({ roomId: id, amenityId })),
            skipDuplicates: true,
          });
        }
      }

      // replace images if provided
      if (dto.images) {
        await tx.roomImage.deleteMany({ where: { roomId: id } });
        if (dto.images.length) {
          await tx.roomImage.createMany({
            data: dto.images.map((url) => ({ roomId: id, url })),
          });
        }
      }
    });

    // return enriched room
    return this.prisma.room.findUnique({
      where: { id },
      include: {
        hotel: { select: { id: true, name: true } },
        type:  { select: { id: true, name: true } },
        images: true,
        roomAmenity: { include: { amenity: { select: { id: true, name: true, icon: true } } } },
      },
    });
  }
}
