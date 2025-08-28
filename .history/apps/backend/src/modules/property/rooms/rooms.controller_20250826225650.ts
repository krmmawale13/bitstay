import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@UseGuards(AuthGuard, TenantGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get('meta')
  async meta(@Req() req) {
    return this.roomsService.meta(req.tenantId);
  }

  @Get()
  async list(@Req() req, @Query('hotelId') hotelId?: string) {
    const hid = hotelId ? Number(hotelId) : undefined;
    return this.roomsService.findMany(req.tenantId, hid);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.roomsService.findOne(id, req.tenantId);
  }

  @Post()
  async create(@Body() dto: CreateRoomDto, @Req() req) {
    return this.roomsService.create(dto, req.tenantId);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoomDto, @Req() req) {
    return this.roomsService.update(id, dto, req.tenantId);
  }

  @Put(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: any, @Req() req) {
    return this.roomsService.update(id, { status }, req.tenantId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.roomsService.remove(id, req.tenantId);
  }
}
