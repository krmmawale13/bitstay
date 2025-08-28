import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { IsArray, ArrayUnique, IsOptional } from 'class-validator';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  // allow replacing amenities
  @IsOptional() @IsArray() @ArrayUnique()
  amenityIds?: number[];
}
import {
  IsInt,
  IsOptional,
  IsIn,
  IsString,
  Matches,
  Min,
  IsArray,
  ArrayUnique,
} from 'class-validator';

export class CreateRoomDto {
  @IsInt()
  @Min(1)
  hotelId: number;

  // allow non-numeric labels like "101A" — but not blank/whitespace
  @IsString()
  @Matches(/\S/, { message: 'number must not be empty' })
  number: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  typeId?: number;

  // rate is a string; 0 or more digits, optional .dd (2 decimals)
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'rate must be a number with up to 2 decimals',
  })
  rate: string;

  @IsIn(['CLEAN', 'DIRTY', 'INSPECT', 'OOO'])
  status: 'CLEAN' | 'DIRTY' | 'INSPECT' | 'OOO';

  // Amenity ids to (re)attach
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  amenityIds?: number[];

  // Initial images (URLs). We keep light validation here; service can further sanitize.
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  images?: string[];
}
