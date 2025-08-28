import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AllocateRoomDto {
  @IsInt()
  @Type(() => Number)
  @Min(1)
  newRoomId!: number; // target Room.id

  @IsOptional()
  @IsString()
  note?: string; // reason / comment (logged in RoomAllocationHistory)
}
