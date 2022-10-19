import { CustomerRelateTodoService } from './customer-relate-todo.service';
import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { CreateCustomerRelateTodoDto } from './dto/create-customer-rel-todo.dto';
import { CustomerService } from '../customer.service';
import { CreateProductRelateCustomerDto } from 'src/products/product-customer/dto/create-product-rel-customer.dto';
import { CustomerRelateStaffService } from './customer-relate-staff.service';
import { CreateCustomerRelateStaffDto } from './dto/create-customer-rel-staff.dto';
import { RelateCustomerService } from 'src/products/product-customer/relate-customer.service';

@ApiTags('Customer')
@Controller('customers')
@BearerJwt()
export class CustomerRelateController {
  constructor(
    private _relateTodoService: CustomerRelateTodoService,
    private _customerService: CustomerService,
    private _customerRelateProduct: RelateCustomerService,
  ) { }

  /**
   * Relate todo
   */
/*
  @Post('/todo')
  addTodo(@Body() dto: CreateCustomerRelateTodoDto) {
    return this._relateTodoService.create(dto);
  }

  @Delete('/todos/:customerId/:todoId')
  removeTodo(@Param('customerId') customerId: string, @Param('todoId') todoId: string) {
    return this._relateTodoService.remove(customerId, todoId);
  }
*/
  /**
   * Relate product
   */
  /*
  @Post('/product')
  addProduct(@Body() dto: CreateProductRelateCustomerDto) {
    return this._customerService.addRelateProduct(dto.customer, dto.product, dto.note);
  }

  @Delete('/products/:customerId/:productId')
  removeProduct(@Param('customerId') customerId: string, @Param('productId') productId: string) {
    return this._customerService.removeRelateProduct(productId, customerId);
  }
  */
  /**
   * Relate staff 
   */

  /*@Post('/staff')
  addStaff(@Body() dto: CreateCustomerRelateStaffDto) {
    return this._relateStaffService.create(dto);
  }

  @Delete('/staffs/:customerId/:staffId')
  removeStaff(@Param('customerId') customerId: string, @Param('staffId') staffId: string) {
    return this._relateStaffService.remove(customerId, staffId);
  }*/
}
