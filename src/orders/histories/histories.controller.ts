import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { SortOrder } from 'src/commons/dto/sorting';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { AuthUser } from 'src/decors/user.decorator';
import { HistoriesService } from './histories.service';
import { Request, Response } from 'express';

@ApiTags('Order')
@Controller('orders/histories')
@BearerJwt()
export class HistoriesController {
    constructor(
        private readonly service: HistoriesService,
    ) { }

    @Get(':orderId')
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })

    getAllOfProduct(
        @AuthUser() authUser: JwtUser,
        @Req() req: Request,
        @Param('orderId') id: string,         
        @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
        @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number) {
        return this.service.getAll(authUser, { ...req.query, order: id, limit, offset });
    }

    @Get('detail/:id')
    getOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
        return this.service.getId(id, authUser);
    }
}
