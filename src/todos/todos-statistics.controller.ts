import {
    Controller, Get, Request } from '@nestjs/common';
  import { TodosService } from './todos.service';
  import { ApiQuery, ApiTags } from '@nestjs/swagger';
  import { AuthUser } from 'src/decors/user.decorator';
  import { JwtUser } from 'src/auth/inteface/jwtUser';
  import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
  import { Request as ExRequest } from 'express';
  
  @ApiTags('Statistics')
  @Controller('statistics/todo')
  @BearerJwt()
  export class StatisticsController {
    constructor(private readonly todosService: TodosService) { }
    
    @Get('date')
    @ApiQuery({ name: 'fromDate', required: false, type: Date })
    @ApiQuery({ name: 'toDate', required: false, type: Date })
    findAllOrderDate(@AuthUser() userReq: JwtUser,
      @Request() req?: ExRequest,
    ) {
      return this.todosService.findAllTodoDate(userReq, {...req.query});
    }
    @Get('staff')
    @ApiQuery({ name: 'fromDate', required: false, type: Date })
    @ApiQuery({ name: 'toDate', required: false, type: Date })
    @ApiQuery({ name: 'staffId', required: true, type: String })
    findAllOrderStaff(@AuthUser() userReq: JwtUser,
      @Request() req?: ExRequest,
    ) {
      return this.todosService.findAllTodoStaff(userReq, {...req.query});
    }

  }
  
