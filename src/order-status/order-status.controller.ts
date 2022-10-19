import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { OrderStatusService } from './order-status.service';
import { CreateOrderStatusDto } from './dto/create-order-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Roles } from 'src/decors/roles.decorator';
import { UserRole } from 'src/users/interface/userRoles';

@ApiTags('Order Status')
@Controller('order-status')
@BearerJwt()
export class OrderStatusController {
  constructor(private readonly orderStatusService: OrderStatusService) { }

  @Post()
  create(@Body() createOrderStatusDto: CreateOrderStatusDto, @AuthUser() authUser: JwtUser) {
    return this.orderStatusService.create(createOrderStatusDto, authUser);
  }

  @Get()
  findAll(@AuthUser() authUser: JwtUser) {
    return this.orderStatusService.findAll(authUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.orderStatusService.findOne(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @AuthUser() authUser: JwtUser) {
    return this.orderStatusService.update(id, updateOrderStatusDto, authUser);
  }

  @Delete(':id')
  // @Roles(UserRole.Admin, UserRole.Owner, UserRole.Manager)
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.orderStatusService.remove(id, authUser);
  }
}