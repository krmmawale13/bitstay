import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@UseGuards(AuthGuard, TenantGuard)
@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  async findAll(@Req() req) {
    return this.hotelsService.findAll(req.tenantId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.hotelsService.findOne(id, req.tenantId);
  }

  @Post()
  async create(@Body() dto: CreateHotelDto, @Req() req) {
    return this.hotelsService.create(dto, req.tenantId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHotelDto,
    @Req() req,
  ) {
    return this.hotelsService.update(id, dto, req.tenantId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.hotelsService.remove(id, req.tenantId);
  }
}
