import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { IsArray, ArrayUnique, IsOptional, IsInt, Min, IsString } from 'class-validator';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  // replace amenities list (optional)
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  amenityIds?: number[];

  // replace image urls (optional)
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  images?: string[];
}
