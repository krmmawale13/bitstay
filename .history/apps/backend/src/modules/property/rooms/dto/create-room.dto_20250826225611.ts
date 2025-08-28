import { IsInt, IsOptional, IsIn, IsString, Matches, Min, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class CreateRoomDto {
  @IsInt() @Min(1)
  hotelId: number;

  @IsString()
  number: string; // keep as string to preserve formatting like "101A"

  @IsOptional() @IsInt() @Min(1)
  typeId?: number;

  // rate is string on FE; validate 2-decimals like INR
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'rate must be a number with up to 2 decimals' })
  rate: string;

  @IsIn(['CLEAN','DIRTY','INSPECT','OOO'])
  status: 'CLEAN' | 'DIRTY' | 'INSPECT' | 'OOO';

  // NEW
  @IsOptional() @IsArray() @ArrayUnique()
  amenityIds?: number[];
}
