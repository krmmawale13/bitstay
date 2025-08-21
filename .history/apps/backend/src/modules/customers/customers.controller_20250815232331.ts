import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { IsString, IsEmail, IsOptional, IsInt, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// --- Inline DTOs ---
class AddressDto {
  @IsString()
  line1: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zip?: string;
}

class CreateCustomerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsInt()
  tenantId: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];
}

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCustomerDto>) {
    return this.customersService.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(Number(id));
  }
}
