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
}
