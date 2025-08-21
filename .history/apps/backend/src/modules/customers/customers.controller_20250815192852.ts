// src/modules/customers/customers.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Prisma } from '@prisma/client';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // GET /customers → list all
  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  // GET /customers/:id → single
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  // POST /customers → create
  @Post()
  create(@Body() data: Prisma.CustomersCreateInput) {
    return this.customersService.create(data);
  }

  // PUT /customers/:id → update
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Prisma.CustomersUpdateInput,
  ) {
    return this.customersService.update(id, data);
  }

  // DELETE /customers/:id → remove
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }
}
