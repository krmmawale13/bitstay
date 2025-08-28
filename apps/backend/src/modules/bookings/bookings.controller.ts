// apps/backend/src/modules/bookings/bookings.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AllocateRoomDto } from './dto/allocate-room.dto';
import { AddGuestDto } from './dto/add-guest.dto';
import { AddChargeDto } from './dto/add-charge.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

type ListQuery = {
  from?: string;
  to?: string;
  status?: BookingStatus;
  customerId?: string;
  roomId?: string;
  sourceId?: string;
  skip?: string;
  take?: string;
};

@UseGuards(AuthGuard, TenantGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  /** Utility: read tenant id placed by TenantGuard */
  private getTenantId(req: any): number {
    // TenantGuard generally sets req.tenant or req.tenantId; support both safely.
    return Number(req?.tenant?.id ?? req?.tenantId ?? req?.headers?.['x-tenant-id']);
  }

  // --------- Queries ---------

  @Get()
  async list(@Req() req: any, @Query() q: ListQuery) {
    const tenantId = this.getTenantId(req);
    return this.service.list(
      {
        from: q.from,
        to: q.to,
        status: q.status,
        customerId: q.customerId ? Number(q.customerId) : undefined,
        roomId: q.roomId ? Number(q.roomId) : undefined,
        sourceId: q.sourceId ? Number(q.sourceId) : undefined,
        skip: q.skip ? Number(q.skip) : 0,
        take: q.take ? Number(q.take) : 20,
      },
      tenantId,
    );
  }

  @Get('meta')
  async meta(@Req() req: any) {
    const tenantId = this.getTenantId(req);
    return this.service.getMeta(tenantId);
  }

  @Get('availability')
  async availability(
    @Req() req: any,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
    @Query('hotelId') hotelId?: string,
  ) {
    const tenantId = this.getTenantId(req);
    return this.service.availability(
      { checkIn, checkOut, hotelId: hotelId ? Number(hotelId) : undefined },
      tenantId,
    );
  }

  @Get('summary')
  async summary(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const tenantId = this.getTenantId(req);
    const { items } = await this.service.list(
      {
        from,
        to,
        skip: 0,
        take: 10000, // simple cap for summaries
      } as any,
      tenantId,
    );

    const buckets = {
      PENDING: 0,
      CONFIRMED: 0,
      CHECKED_IN: 0,
      CHECKED_OUT: 0,
      CANCELLED: 0,
    } as Record<BookingStatus, number>;

    for (const b of items) {
      const s = String(b.status) as BookingStatus;
      if (s in buckets) buckets[s]++;
    }

    return {
      total: items.length,
      ...buckets,
    };
  }

  @Get(':id')
  async get(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const tenantId = this.getTenantId(req);
    return this.service.get(id, tenantId);
  }

  // --------- Mutations ---------

  @Post()
  async create(@Req() req: any, @Body() dto: CreateBookingDto) {
    const tenantId = this.getTenantId(req);
    return this.service.create(dto, tenantId);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingDto,
  ) {
    const tenantId = this.getTenantId(req);
    return this.service.update(id, dto, tenantId);
  }

  @Post(':id/allocate-room')
  async allocateRoom(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AllocateRoomDto,
  ) {
    const tenantId = this.getTenantId(req);
    return this.service.allocateRoom(id, dto, tenantId);
  }

  @Post(':id/guests')
  async addGuests(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddGuestDto,
  ) {
    const tenantId = this.getTenantId(req);
    return this.service.addGuests(id, dto, tenantId);
  }

  // NEW: remove a single guest from a booking
  @Delete(':id/guests/:guestId')
  async removeGuest(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('guestId', ParseIntPipe) guestId: number,
  ) {
    const tenantId = this.getTenantId(req);
    return this.service.removeGuest(id, guestId, tenantId);
  }

  @Post(':id/charges')
  async addCharge(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddChargeDto,
  ) {
    const tenantId = this.getTenantId(req);
    return this.service.addCharge(id, dto, tenantId);
  }

  @Post(':id/payments')
  async addPayment(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPaymentDto,
  ) {
    const tenantId = this.getTenantId(req);
    return this.service.addPayment(id, dto, tenantId);
  }

  // NEW: explicit confirm action (PENDING -> CONFIRMED)
  @Post(':id/confirm')
  async confirm(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const tenantId = this.getTenantId(req);
    return this.service.confirm(id, tenantId);
  }

  @Post(':id/check-in')
  async checkIn(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const tenantId = this.getTenantId(req);
    return this.service.checkIn(id, tenantId);
  }

  @Post(':id/check-out')
  async checkOut(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const tenantId = this.getTenantId(req);
    return this.service.checkOut(id, tenantId);
  }

  @Post(':id/cancel')
  async cancel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const tenantId = this.getTenantId(req);
    return this.service.cancel(id, tenantId);
  }
}
