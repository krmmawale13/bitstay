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
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateRoomStatusDto } from './dto/update-room-status.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { IsArray, ArrayNotEmpty, IsInt, Min, IsString, IsUrl } from 'class-validator';

/* ---------- tiny DTOs for images ---------- */
class AddRoomImagesDto {
  @IsArray() @ArrayNotEmpty()
  urls!: string[]; // allow presigned URLs or absolute URLs; FE can validate/normalize further
}

class ReorderRoomImagesDto {
  @IsArray() @ArrayNotEmpty()
  @IsInt({ each: true }) @Min(1, { each: true })
  ids!: number[]; // final order of existing image IDs
}

@UseGuards(AuthGuard, TenantGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // keep meta BEFORE :id
  @Get('meta')
  async meta(@Req() req) {
    return this.roomsService.meta(req.tenantId);
  }

  @Get()
  async findAll(@Req() req, @Query('hotelId') hotelId?: string) {
    return this.roomsService.findAll(
      req.tenantId,
      hotelId ? Number(hotelId) : undefined,
    );
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

  /* =========================
   * Room IMAGES (RoomImage)
   * ========================= */

  // Add one or more images (array of URLs). Service will create RoomImage rows.
  @Post(':id/images')
  async addImages(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddRoomImagesDto,
    @Req() req,
  ) {
    return this.roomsService.addImages(id, dto.urls, req.tenantId);
  }

  // Delete a single image by its imageId
  @Delete(':id/images/:imageId')
  async removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Req() req,
  ) {
    return this.roomsService.removeImage(id, imageId, req.tenantId);
  }

  // Optional: reorder images (persist a simple position index on RoomImage if you add that column)
  @Put(':id/images/order')
  async reorderImages(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderRoomImagesDto,
    @Req() req,
  ) {
    return this.roomsService.reorderImages(id, dto.ids, req.tenantId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.roomsService.remove(id, req.tenantId);
  }
}
