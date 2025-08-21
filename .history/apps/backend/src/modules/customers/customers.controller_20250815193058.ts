import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const customer = await this.customersService.findOne(Number(id));
    if (!customer) throw new NotFoundException(`Customer with ID ${id} not found`);
    return customer;
  }

  @Post()
  async create(@Body() data: any) {
    return this.customersService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.customersService.update(Number(id), data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.customersService.remove(Number(id));
  }
}
