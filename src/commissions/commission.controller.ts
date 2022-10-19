import {
  Controller, Get, Post, Body, Param, Delete, Request,
  Put, Query, DefaultValuePipe, ParseIntPipe
} from '@nestjs/common';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request as ExRequest } from 'express';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { CommissionService } from './commission.service';
import { CreateArrCommissionDto, CreateCommissionDto } from './dto/create-commission.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { SortOrder } from 'src/commons/dto/sorting';
import { ArrayObjectIdValidationPipe } from 'src/commons/pipes/array-object-id-validation.pipe';

@ApiTags('Commission')
@Controller('commissions')
@BearerJwt()
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) { }

  @Post()
  create(@Body() createCommissionDto: CreateCommissionDto, @AuthUser() authUser: JwtUser) {
    return this.commissionService.create(createCommissionDto, authUser);
  }
  
  @Post('arryCommission')
  addArrCommission(@Body() createArrCommissionDto: CreateArrCommissionDto, @AuthUser() authUser: JwtUser) {
    return this.commissionService.addArrCommission(createArrCommissionDto, authUser);
  }

  @Get()
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  findAll(@AuthUser() authUser: JwtUser,@Request() req?: ExRequest,) {
    return this.commissionService.findAll(authUser,req.query);
  }

  @Get('order-year')
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: Date })
  findAllOrderCommissions(@AuthUser() userReq: JwtUser,
    @Query('userId') userId?: string,
    @Query('date') date?: Date,
  ) {
    return this.commissionService.findAllOrderCommissions(userReq, userId, date);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.commissionService.findOne(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCommissionDto: UpdateCommissionDto, @AuthUser() authUser: JwtUser) {
    return this.commissionService.update(id, updateCommissionDto, authUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.commissionService.remove(id, authUser);
  }

}
