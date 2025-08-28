import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateBookingDto {
  // Allow limited edits; status transitions are separate endpoints.
  @IsOptional()
  @IsDateString()
  checkIn?: string; // ISO string

  @IsOptional()
  @IsDateString()
  checkOut?: string; // ISO string

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  sourceId?: number; // BookingSource.id

  // NOTE: Room changes are handled via /allocate-room
  // NOTE: Guests via /guests endpoint
  // NOTE: Charges/Payments via their own endpoints
}
