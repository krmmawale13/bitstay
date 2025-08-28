import { IsString, IsOptional } from 'class-validator';

export class CreateHotelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;
}
