import { Controller, Get, Param, Req, DefaultValuePipe, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { AuthUser } from 'src/decors/user.decorator';
import { CustomerHistoriesService } from './customer-histories.service';
import { SortOrder } from 'src/commons/dto/sorting';
import { Request, Response } from 'express';

@ApiTags('Customer')
@Controller('customers/histories')
@BearerJwt()
export class CustomerHistoriesController {
    constructor(
        private readonly service: CustomerHistoriesService,
    ) { }

    @Get(':customerId')
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
    @ApiQuery({ name: 'fromDate', required: false, type: Date, example: '2021-09-01T04:11:16.891Z' })
    @ApiQuery({ name: 'toDate', required: false, type: Date, example: '2021-09-10' })
    @ApiQuery({ name: 'search', required: false, type: String })
    findAll(@AuthUser() authUser: JwtUser,
        @Req() req: Request,
        @Param('customerId') id: string, 
        @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
        @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
        @Query('search') search?: string,
        ) {
        return this.service.getAll(authUser, { ...req.query, search, customer:id, limit, offset });
    }

    @Get('detail/:id')
    getOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
        return this.service.getId(id, authUser);
    }
}
