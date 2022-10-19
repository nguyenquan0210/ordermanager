import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { CreateOrderCommentDto, CreateOrderReplyDto } from './dto/create-order-comment.dto';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { OrderCommentService } from './order-comment/order-comment.service';

@ApiTags('Order')
@Controller('orders/comment')
@BearerJwt()
export class OrderCommentController {
  constructor(private readonly orderCommentService: OrderCommentService) { }

  @Post()
  create(@Body() createOrderCommentDto: CreateOrderCommentDto, @AuthUser() authUser: JwtUser) {
    return this.orderCommentService.create(createOrderCommentDto, authUser);
  }

  @Post('reply')
  createReply(@Body() createOrderReplyDto: CreateOrderReplyDto, @AuthUser() authUser: JwtUser) {
    return this.orderCommentService.createReply(createOrderReplyDto, authUser);
  }

  @Get()
  @ApiQuery({ name: 'idOrder', required: false, type: String })
  findAll(@AuthUser() authUser: JwtUser, @Query('idOrder') idOrder?: string,) {
    return this.orderCommentService.findAll(idOrder, authUser);
  }

  // @Get(':id')
  // @ApiQuery({ name: 'status', required: false, type: String })
  // findAll(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
  //   return this.todoCommentService.findCommentTodo(idTodo, authUser);
  // }

  // @Put(':id')
  // update(@Param('id') id: string, @Body() updateLabelDto: UpdateLabelDto, @AuthUser() authUser: JwtUser) {
  //   return this.labelsService.update(id, updateLabelDto, authUser);
  // }

  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.orderCommentService.remove(id, authUser);
  }
}
