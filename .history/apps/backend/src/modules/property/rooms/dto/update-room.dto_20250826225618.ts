import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { IsArray, ArrayUnique, IsOptional } from 'class-validator';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  // allow replacing amenities
  @IsOptional() @IsArray() @ArrayUnique()
  amenityIds?: number[];
}
