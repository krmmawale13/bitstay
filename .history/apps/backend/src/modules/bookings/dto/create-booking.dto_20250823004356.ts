import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayUnique,
} from 'class-validator';

class GuestInputDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  idTypeId?: number;

  @IsOptional()
  @IsString()
  idNumber?: string;
}

export class CreateBookingDto {
  @IsInt()
  @Type(() => Number)
  @Min(1)
  customerId!: number;

  @IsDateString()
  checkIn!: string; // ISO string

  @IsDateString()
  checkOut!: string; // ISO string

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  sourceId?: number; // BookingSource.id

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  rooms?: number[]; // Room IDs

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestInputDto)
  guests?: GuestInputDto[];
}
