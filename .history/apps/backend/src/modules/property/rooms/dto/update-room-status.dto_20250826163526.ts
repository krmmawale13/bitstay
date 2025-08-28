import { IsEnum } from 'class-validator';

export class UpdateRoomStatusDto {
  @IsEnum(['CLEAN', 'DIRTY', 'INSPECT', 'OOO'])
  status: 'CLEAN' | 'DIRTY' | 'INSPECT' | 'OOO';
}
