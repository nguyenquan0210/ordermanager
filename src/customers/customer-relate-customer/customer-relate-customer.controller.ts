import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { AuthUser } from 'src/decors/user.decorator';
import { CustomerRelateCustomerService } from './customer-relate-customer.service';
import { CreateCustomerRelateCustomerDto } from './dto/create-customer-relate-customer.dto';
import { UpdateCustomerRelateCustomerDto } from './dto/update-customer-relate-customer.dto';

@ApiTags('Customer')
@Controller('customer-relate-customer')
@BearerJwt()
export class CustomerRelateCustomerController {
  constructor(private readonly customerCustomerService: CustomerRelateCustomerService) { }

  @Post()
  create(@Body() dto: CreateCustomerRelateCustomerDto, @AuthUser() authUser: JwtUser) {
    return this.customerCustomerService.create(dto, authUser);
  }

  @Get()
  @ApiQuery({
    name: 'customer', required: false,
    type: String,
    description: 'get customer relate of a customer'
  })
  findAll(
    @AuthUser() authUser: JwtUser,
    @Query('customer') customer: string,
  ) {
    return this.customerCustomerService.findAll(authUser, { customer });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.customerCustomerService.findOne(id, authUser);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerRelateCustomerDto, @AuthUser() authUser: JwtUser) {
    return this.customerCustomerService.update(id, dto, authUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.customerCustomerService.remove(id, authUser);
  }
}
