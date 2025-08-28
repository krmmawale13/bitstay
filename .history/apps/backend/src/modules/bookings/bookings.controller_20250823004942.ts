import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AllocateRoomDto } from './dto/allocate-room.dto';
import { AddGuestDto } from './dto/add-guest.dto';
import { AddChargeDto } from './dto/add-charge.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { PermissionsService } from '../auth/permissions.service';
import { BookingStatus } from '@prisma/client';

type ListQuery = {
  from?: string;
  to?: string;
  status?: BookingStatus | string;
  customerId?: string;
  roomId?: string;
  sourceId?: string;
  skip?: string;
  take?: string;
};

@UseGuards(AuthGuard, TenantGuard)
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly perms: PermissionsService,
  ) {}

  // --- helpers ---
  private getIds(req: any): { userId: number; tenantId: number } {
    const userId = Number(req?.user?.userId);
    const tenantId = Number(req?.tenantId ?? req?.tenant?.id);
    if (!userId || !tenantId) throw new BadRequestException('Context missing');
    return { userId, tenantId };
  }

  private async assertCan(
    req: any,
    required: string | string[],
  ): Promise<void> {
    const { userId, tenantId } = this.getIds(req);
    const effective = await this.perms.resolveForUser(userId, tenantId);
    const needed = Array.isArray(required) ? required : [required];
    const ok = needed.some((k) => effective.includes(k));
    if (!ok) throw new ForbiddenException('Not allowed');
  }

  // --- queries ---

  @Get()
  async list(@Req() req: any, @Query() q: ListQuery) {
    await this.assertCan(req, 'bookings.read');
    const { tenantId } = this.getIds(req);

    const params = {
      from: q.from,
      to: q.to,
      status:
        q.status && Object.values(BookingStatus).includes(q.status as any)
          ? (q.status as BookingStatus)
          : undefined,
      customerId: q.customerId ? Number(q.customerId) : undefined,
      roomId: q.roomId ? Number(q.roomId) : undefined,
      sourceId: q.sourceId ? Number(q.sourceId) : undefined,
      skip: q.skip ? Number(q.skip) : 0,
      take: q.take ? Number(q.take) : 20,
    };

    return this.bookings.list(params, tenantId);
  }

  @Get('meta')
  async meta(@Req() req: any) {
    await this.assertCan(req, 'bookings.read');
    const { tenantId } = this.getIds(req);
    return this.bookings.getMeta(tenantId);
  }

  @Get('availability')
  async availability(
    @Req() req: any,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
    @Query('hotelId') hotelId?: string,
  ) {
    await this.assertCan(req, 'bookings.read');
    const { tenantId } = this.getIds(req);
    if (!checkIn || !checkOut)
      throw new BadRequestException('checkIn & checkOut required');
    return this.bookings.availability(
      { checkIn, checkOut, hotelId: hotelId ? Number(hotelId) : undefined },
      tenantId,
    );
  }

  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) {
    await this.assertCan(req, 'bookings.read');
    const { tenantId } = this.getIds(req);
    return this.bookings.get(Number(id), tenantId);
  }

  // --- mutations ---

  @Post()
  async create(@Req() req: any, @Body() dto: CreateBookingDto) {
    await this.assertCan(req, 'bookings.manage');
    const { tenantId } = this.getIds(req);
    return this.bookings.create(dto, tenantId);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    await this.assertCan(req, 'bookings.manage');
    const { tenantId } = this.getIds(req);
    return this.bookings.update(Number(id), dto, tenantId);
  }

  @Post(':id/allocate-room')
  async allocateRoom(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AllocateRoomDto,
  ) {
    await this.assertCan(req, 'bookings.manage');
    const { tenantId } = this.getIds(req);
    return this.bookings.allocateRoom(Number(id), dto, tenantId);
  }

  @Post(':id/guests')
  async addGuests(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AddGuestDto,
  ) {
    await this.assertCan(req, 'bookings.manage');
    const { tenantId } = this.getIds(req);
    return this.bookings.addGuests(Number(id), dto, tenantId);
  }

  @Post(':id/charges')
  async addCharge(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AddChargeDto,
  ) {
    await this.assertCan(req, 'bookings.manage');
    const { tenantId } = this.getIds(req);
    return this.bookings.addCharge(Number(id), dto, tenantId);
  }

  @Post(':id/payments')
  async addPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AddPaymentDto,
  ) {
    await this.assertCan(req, 'bookings.manage');
    const { tenantId } = this.getIds(req);
    return this.bookings.addPayment(Number(id), dto, tenantId);
  }

  @Post(':id/check-in')
  async checkIn(@Req() req: any, @Param('id') id: string) {
    await this.assertCan(req, 'bookings.manage');
    const { tenantId } = this.getIds(req);
    return this.bookings.checkIn(Number(id), tenantId);
  }

  @Post(':id/check-out')
  async checkOut(@Req() req: any, @Param('id') id: string) {
    await this.assertCan(req, 'bookings.manage');
    const { tenantId } = this.getIds(req);
    return this.bookings.checkOut(Number(id), tenantId);
  }

  @Post(':id/cancel')
  async cancel(@Req() req: any, @Param('id') id: string) {
    await this.assertCan(req, 'bookings.manage');
    const { tenantId } = this.getIds(req);
    return this.bookings.cancel(Number(id), tenantId);
  }
}
