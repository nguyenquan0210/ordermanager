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
import { UpdateDoneOrderDto } from './dto/update-done-order.dto';
import { UpdateCancelOrderDto } from './dto/update-cancel-order.dto';
import { RequestConfirmationOrderDto } from './dto/request-confirmation-order.dto';
  
  @ApiTags('Order')
  @Controller('orders')
  @BearerJwt()
  export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }
  
    @Post()
    create(@Body() createOrderDto: CreateOrderDto,
      @AuthUser() userReq: JwtUser) {
      return this.ordersService.create(createOrderDto, userReq);
    }

    @Get()
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'states', required: false, type: String })
    @ApiQuery({ name: 'customerid', required: false, type: String })
    @ApiQuery({ name: 'fromDate', required: false, type: Date, example: '' })
    @ApiQuery({ name: 'toDate', required: false, type: Date, example: '' })
    @ApiQuery({ name: 'fromTotalMoney', required: false, type: Number })
    @ApiQuery({ name: 'toTotalMoney', required: false, type: Number })
    @ApiQuery({ name: 'isOwner', required: false, type: Boolean })
    @ApiQuery({ name: 'sortBy', required: false, type: String })
    @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
    @ApiQuery({ name: 'labels', required: false, type: String })
    @ApiQuery({ name: 'staffId', required: false, type: String })
    @ApiQuery({ name: 'requestConfirmation', required: false, type: Boolean })
    findAll(@AuthUser() userReq: JwtUser,
      @Request() req?: ExRequest,
      @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
      @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
      @Query('search') search?: string,
      @Query('customerid') customers?: string,
      @Query('staffId') staffId?: string,

    ) {
      return this.ordersService.findAll(userReq, {
        ...req.query,
        search, 
        limit, 
        offset,
        customers,
        staffId
      });
    }

    @ApiQuery({ name: 'idProduct', required: true, type: String })
    @Get('orderProduct')
    findOrderProduct(@Query('idProduct') idProduct: string, @AuthUser() userReq: JwtUser) {
      return this.ordersService.findOrderProduct(idProduct, userReq);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
      return this.ordersService.findOne(id, userReq);
    }
  
    @Put(':id')
    update(@Param('id') id: string,
      @Body() updateOrderDto: UpdateOrderDto,
      @AuthUser() userReq: JwtUser) {
      return this.ordersService.update(id, updateOrderDto, userReq);
    }

    @Put(':id/done')
    updateDone(@Param('id') id: string,
      @Body() updateDoneOrderDto: UpdateDoneOrderDto,
      @AuthUser() userReq: JwtUser) {
      return this.ordersService.updateDone(id, updateDoneOrderDto, userReq);
    }

    @Put(':id/cancel')
    updateCancel(@Param('id') id: string,
      @Body() updateCancelOrderDto: UpdateCancelOrderDto,
      @AuthUser() userReq: JwtUser) {
      return this.ordersService.updateCancel(id, updateCancelOrderDto, userReq);
    }

    @Put(':id/request-confirmation')
    requestConfirmation(@Param('id') id: string,
      @Body() requestConfirmationOrderDto: RequestConfirmationOrderDto,
      @AuthUser() userReq: JwtUser) {
      return this.ordersService.requestConfirmation(id, requestConfirmationOrderDto, userReq);
    }

    @Post(':id/recheck')
    recheck(@Param('id') id: string,
      @AuthUser() userReq: JwtUser) {
      return this.ordersService.recheck(id, userReq);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
      return this.ordersService.remove(id, userReq);
    }
  }
  
