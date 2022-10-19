import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { CreateProductRelateCustomerDto } from './dto/create-product-rel-customer.dto';
import { RelateCustomerService } from './relate-customer.service';

@ApiTags('Product')
@Controller('products/relateCustomers')
@BearerJwt()
export class RelateCustomerController {
  constructor(
    private service: RelateCustomerService
  ) { }

  @Post()
  add(@Body() dto: CreateProductRelateCustomerDto) {
    return this.service.create(dto);
  }

  @Delete(':product/:customer')
  remove(@Param('product') productId: string, @Param('customer') customerId: string) {
    return this.service.remove(productId, customerId);
  }
}
