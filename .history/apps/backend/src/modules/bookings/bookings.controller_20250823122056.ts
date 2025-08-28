import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AllocateRoomDto } from './dto/allocate-room.dto';
import { AddGuestDto } from './dto/add-guest.dto';
import { AddChargeDto } from './dto/add-charge.dto';
import { AddPaymentDto } from './dto/add-payment.dto';

@UseGuards(AuthGuard, TenantGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly svc: BookingsService) {}

  // --------- META ---------
  /**
   * GET /api/v1/bookings/meta
   * Returns booking pick-lists: sources, idTypes, paymentModes
   */
  @Get('meta')
  async meta(@Req() req: any) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.svc.getMeta(tenantId);
  }

  // --------- AVAILABILITY ---------
  /**
   * GET /api/v1/bookings/availability?checkIn=ISO&checkOut=ISO&hotelId=#
   * Returns available rooms for the given window (excludes overlapping active bookings)
   */
  @Get('availability')
  async availability(
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
    @Query('hotelId') hotelId: string | undefined,
    @Req() req: any,
  ) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    const hid = hotelId ? Number(hotelId) : undefined;
    return this.svc.availability({ checkIn, checkOut, hotelId: hid }, tenantId);
  }

  // --------- LIST ---------
  /**
   * GET /api/v1/bookings
   */
  @Get()
  async list(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('status') status: any,
    @Query('customerId') customerId: string | undefined,
    @Query('roomId') roomId: string | undefined,
    @Query('sourceId') sourceId: string | undefined,
    @Query('skip') skip: string | undefined,
    @Query('take') take: string | undefined,
    @Req() req: any,
  ) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.svc.list(
      {
        from,
        to,
        status,
        customerId: customerId ? Number(customerId) : undefined,
        roomId: roomId ? Number(roomId) : undefined,
        sourceId: sourceId ? Number(sourceId) : undefined,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
      },
      tenantId,
    );
  }

  // --------- GET ONE ---------
  /**
   * GET /api/v1/bookings/:id
   */
  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.svc.get(id, tenantId);
  }

  // --------- CREATE ---------
  /**
   * POST /api/v1/bookings
   */
  @Post()
  async create(@Body() dto: CreateBookingDto, @Req() req: any) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.svc.create(dto, tenantId);
  }

  // --------- UPDATE ---------
  /**
   * PUT /api/v1/bookings/:id
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingDto,
    @Req() req: any,
  ) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.svc.update(id, dto, tenantId);
  }

  // --------- ALLOCATE ROOM ---------
  /**
   * POST /api/v1/bookings/:id/allocate-room
   */
  @Post(':id/allocate-room')
  async allocateRoom(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AllocateRoomDto,
    @Req() req: any,
  ) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.svc.allocateRoom(id, dto, tenantId);
  }

  // --------- ADD GUESTS ---------
  /**
   * POST /api/v1/bookings/:id/guests
   */
  @Post(':id/guests')
  async addGuests(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddGuestDto,
    @Req() req: any,
  ) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.svc.addGuests(id, dto, tenantId);
  }

  // --------- ADD CHARGE ---------
  /**
   * POST /api/v1/bookings/:id/charges
   */
  @Post(':id/charges')
  async addCharge(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddChargeDto,
    @Req() req: any,
  ) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.svc.addCharge(id, dto, tenantId);
  }

  // --------- ADD PAYMENT ---------
  /**
   * POST /api/v1/bookings/:id/payments
   */
  @Post(':id/payments')
  async addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPaymentDto,
    @Req() req: any,
  ) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.svc.addPayment(id, dto, tenantId);
  }

  // --------- CHECK-IN / OUT / CANCEL ---------
  @Post(':id/check-in')
  async checkIn(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.svc.checkIn(id, tenantId);
  }

  @Post(':id/check-out')
  async checkOut(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.svc.checkOut(id, tenantId);
  }

  @Post(':id/cancel')
  async cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.svc.cancel(id, tenantId);
  }
}
