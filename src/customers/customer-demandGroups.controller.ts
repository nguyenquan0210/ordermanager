  import { Controller, Get, Post, Body, Query, ParseIntPipe, DefaultValuePipe, Request, Put, Param, Delete } from '@nestjs/common';
  import { CustomerDemandGroupsService } from './customer-demandGroup/customer-demandGroup.service';
  import { CreateCustomerDemandGroupsDto } from './customer-demandGroup/dto/create-customer-demandGroup.dto'
  import { JwtUser } from 'src/auth/inteface/jwtUser';
  import { AuthUser } from 'src/decors/user.decorator';
  import { ApiTags, ApiQuery } from '@nestjs/swagger';
  import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
  import { Request as ExRequest } from 'express';
  import { UpdateCustomerDemandGroupsDto } from './customer-demandGroup/dto/update-customer-demandGroup.dto';

  @ApiTags('Demand Groups')
  @Controller('customer-demandGrs')
  @BearerJwt()
  export class CustomerDemandGroupsController {
    constructor(private readonly customerDemandGroupsService: CustomerDemandGroupsService) { }
  
    @Post()
    create(@Body() createCustomerDemandGroupsDto: CreateCustomerDemandGroupsDto, @AuthUser() authUser: JwtUser) {
      return this.customerDemandGroupsService.create(createCustomerDemandGroupsDto, authUser);
    }
  
    @Get()
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    findAll(@AuthUser() authUser: JwtUser,
    @Request() req?: ExRequest,
    @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number) 
    {
      return this.customerDemandGroupsService.findAll(authUser, {
        ...req.query,
        limit, offset
      });
    }

    @Get(':id')
    findOne(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
      return this.customerDemandGroupsService.findOne(id, userReq);
    }
     /**
   * Update customer demand groups
   */
    @Put(':id')
    update(@Param('id') id: string, @Body() updateCustomerDemandGroupsDto: UpdateCustomerDemandGroupsDto,
    @AuthUser() authUser: JwtUser) {
      return this.customerDemandGroupsService.update(id, updateCustomerDemandGroupsDto, authUser);
    }

    /**
   * Delete demand Groups
   */
    @Delete(':id')
    remove(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
      return this.customerDemandGroupsService.remove(id, userReq);
    }
  
  }
  