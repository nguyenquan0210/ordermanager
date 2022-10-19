import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { SortOrder } from 'src/commons/dto/sorting';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { AuthUser } from 'src/decors/user.decorator';
import { TodoHistoriesService } from './todo-history.service';
import { Request, Response } from 'express';

@ApiTags('Todo')
@Controller('todos/histories')
@BearerJwt()
export class TodoHistoriesController {
    constructor(
        private readonly service: TodoHistoriesService,
    ) { }

    @Get(':todoId')
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
    getAllOfTodo(
        @AuthUser() authUser: JwtUser,
        @Req() req: Request,
        @Param('todoId') id: string,         
        @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
        @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number) {
        return this.service.getAll(authUser, { ...req.query, todo: id, limit, offset  });
    }

    @Get('detail/:id')
    getOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
        return this.service.getId(id, authUser);
    }
}
