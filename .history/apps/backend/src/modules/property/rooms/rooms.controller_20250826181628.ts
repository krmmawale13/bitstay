import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateRoomStatusDto } from './dto/update-room-status.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  /* ---------- NEW: meta must appear before :id route ---------- */
  @Get('meta')
  async meta(@Req() req) {
    return this.roomsService.meta(req.tenantId);
  }

  @Get()
  async findAll(@Req() req, @Query('hotelId') hotelId?: string) {
    return this.roomsService.findAll(req.tenantId, hotelId ? +hotelId : undefined);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.roomsService.findOne(id, req.tenantId);
  }

  @Post()
  async create(@Body() dto: CreateRoomDto, @Req() req) {
    return this.roomsService.create(dto, req.tenantId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomDto,
    @Req() req,
  ) {
    return this.roomsService.update(id, dto, req.tenantId);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomStatusDto,
    @Req() req,
  ) {
    return this.roomsService.updateStatus(id, dto, req.tenantId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.roomsService.remove(id, req.tenantId);
  }
}
