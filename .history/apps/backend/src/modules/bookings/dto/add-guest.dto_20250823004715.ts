import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class GuestDto {
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

export class AddGuestDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GuestDto)
  guests!: GuestDto[];
}
