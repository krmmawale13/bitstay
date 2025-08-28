import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsInt, Min } from 'class-validator';

export class AddPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  modeId?: number; // PaymentMode.id
}
