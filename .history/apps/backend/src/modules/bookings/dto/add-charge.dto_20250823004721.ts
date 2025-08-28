import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddChargeDto {
  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;
}
