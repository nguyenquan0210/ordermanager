import { Controller, Get, Post, Body, Req, Param, Delete, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { AuthUser } from 'src/decors/user.decorator';
import { CustomerProvinceService } from './customer-province.service';
import { Request, Response } from 'express';
import { SortOrder } from 'src/commons/dto/sorting';

@ApiTags('Customer')
@Controller('customer-province')
@BearerJwt()
export class CustomerProvinceController {
  constructor(private readonly customerProvinceService: CustomerProvinceService) { }

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'code', required: false,type: Number })
  findAll(@AuthUser() authUser: JwtUser,
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
    @Query('search') search?: string,
  ) {
    return this.customerProvinceService.findAll(authUser, { ...req.query, limit, offset, search });
  }

  @Get('provinces')
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'code', required: false,type: Number })
  findAllProvince(@AuthUser() authUser: JwtUser,
    @Query('search') search?: string,
    @Query('code') code?: number,
  ) {
    return this.customerProvinceService.findAllProvince(authUser, { search, code });
  }
 
  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.customerProvinceService.findOne(id, authUser);
  }

  @Get(':id/districts')
  findAllDistricts(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.customerProvinceService.findAllDistricts(id, authUser);
  }
 
}
