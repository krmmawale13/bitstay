import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHotelDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  address?: string;
}
