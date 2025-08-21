import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() body: any) {
    return this.customersService.create(body);
  }
@Get()
findAll() {
  return { message: 'Customers route works!' };
}


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.customersService.update(Number(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(Number(id));
  }
}
