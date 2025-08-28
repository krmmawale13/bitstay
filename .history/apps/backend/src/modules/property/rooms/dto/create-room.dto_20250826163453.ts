import { IsInt, IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';

export class CreateRoomDto {
  @IsInt()
  hotelId: number;

  @IsString()
  number: string;

  @IsOptional()
  @IsInt()
  typeId?: number;

  @IsOptional()
  @IsEnum(['CLEAN', 'DIRTY', 'INSPECT', 'OOO'])
  status?: 'CLEAN' | 'DIRTY' | 'INSPECT' | 'OOO';

  @IsNumberString()
  rate: string;
}
