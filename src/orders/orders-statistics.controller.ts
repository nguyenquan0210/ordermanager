import {
  Controller, Get, Post, Body, Param, Delete, Request,
  Put, Query, DefaultValuePipe, ParseIntPipe
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/decors/user.decorator';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { Request as ExRequest } from 'express';
import { SortOrder } from 'src/commons/dto/sorting';

@ApiTags('Statistics')
@Controller('statistics/order')
@BearerJwt()
export class StatisticsController {
  constructor(private readonly ordersService: OrdersService) { }

  @Get('date')
  @ApiQuery({ name: 'fromDate', required: false, type: Date })
  @ApiQuery({ name: 'toDate', required: false, type: Date })
  findAllOrderDate(@AuthUser() userReq: JwtUser,
    @Request() req?: ExRequest,
  ) {
    return this.ordersService.findAllOrderDate(userReq, { ...req.query });
  }

  @Get('date-label')
  @ApiQuery({ name: 'fromDate', required: false, type: Date })
  @ApiQuery({ name: 'toDate', required: false, type: Date })
  findAllOrderDateLabel(@AuthUser() userReq: JwtUser,
    @Request() req?: ExRequest,
  ) {
    return this.ordersService.findAllOrderDateLabel(userReq, { ...req.query });
  }

  @Get('customer')
  @ApiQuery({ name: 'fromDate', required: false, type: Date })
  @ApiQuery({ name: 'toDate', required: false, type: Date })
  @ApiQuery({ name: 'customers', required: true, type: String })
  findAllOrderCustomer(@AuthUser() userReq: JwtUser,
    @Request() req?: ExRequest,
  ) {
    return this.ordersService.findAllOrderCustomer(userReq, { ...req.query });
  }

  @Get('product')
  @ApiQuery({ name: 'fromDate', required: false, type: Date })
  @ApiQuery({ name: 'toDate', required: false, type: Date })
  @ApiQuery({ name: 'product', required: true, type: String })
  findAllOrderProduct(@AuthUser() userReq: JwtUser,
    @Request() req?: ExRequest,
  ) {
    return this.ordersService.findAllOrderProduct(userReq, { ...req.query });
  }

  @Get('staff')
  @ApiQuery({ name: 'fromDate', required: false, type: Date })
  @ApiQuery({ name: 'toDate', required: false, type: Date })
  @ApiQuery({ name: 'staffId', required: true, type: String })
  findAllOrderStaff(@AuthUser() userReq: JwtUser,
    @Request() req?: ExRequest,
  ) {
    return this.ordersService.findAllOrderStaff(userReq, { ...req.query });
  }

  @Get('month')
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: Date })
  findAllOrderMonth(@AuthUser() userReq: JwtUser,
    @Query('userId') userId?: string,
    @Query('date') date?: Date,
  ) {
    return this.ordersService.findAllOrderMonth(userReq, userId, date);
  }

  @Get('year')
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: Date })
  findAllOrderYear(@AuthUser() userReq: JwtUser,
    @Query('userId') userId?: string,
    @Query('date') date?: Date,
  ) {
    return this.ordersService.findAllOrderYear(userReq, userId, date);
  }

  @Get('all-staff-month')
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: Date })
  findAllOrderTopStaff(@AuthUser() userReq: JwtUser,
    @Query('userId') userId?: string,
    @Query('date') date?: Date) {
    return this.ordersService.findAllOrderTopStaff(userReq, userId, date);
  }

  @Get('top-staff-year')
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: Date, description: 'year' })
  findTopStaffYear(@AuthUser() userReq: JwtUser,
    @Query('userId') userId?: string,
    @Query('date') date?: Date) {
    return this.ordersService.findTopStaffYear(userReq, userId, date);
  }

}

