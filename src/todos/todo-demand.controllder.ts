import { Controller, Get, Post, Body, Query, ParseIntPipe, DefaultValuePipe, Request, Put, Param, Delete } from '@nestjs/common';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { Request as ExRequest } from 'express';
import { TodoDemandService } from './todo-demand/todo-demand.service';
import { CreateTodoDemandDto } from './todo-demand/dto/create-todo-demand.dto';
import { UpdateTodoDemandDto } from './todo-demand/dto/update-todo-demand.dto';
import { SortOrder } from 'src/commons/dto/sorting';
import { ArrayObjectIdValidationPipe } from 'src/commons/pipes/array-object-id-validation.pipe';
import { OkRespone } from 'src/commons/OkResponse';
import { DemandTarget } from './interface/demand-target';

@ApiTags('Todo-Demand')
@Controller('todo-demands')
@BearerJwt()
export class TodoDemandController {
  constructor(private readonly todoDemandService: TodoDemandService) { }

  @Post()
  create(@Body() createTodoDemandDto: CreateTodoDemandDto, @AuthUser() authUser: JwtUser) {
    return this.todoDemandService.create(createTodoDemandDto, authUser);
  }
  
  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'target', required: false, enum: DemandTarget })
  @ApiQuery({
    name: 'demandDate', required: false, type: Date,
    description: 'Filter date when demand still valid (startTime < demandDate < endTime)'
  })
  @ApiQuery({
    name: 'demandEndDate', required: false, type: Date,
    description: 'Filter date when demand still valid. Combine with demandDate to query demand in range'
  })
  @ApiQuery({
    name: 'fromDate', required: false, type: Date,
    description: 'Filter createdAt min date'
  })
  @ApiQuery({
    name: 'toDate', required: false, type: Date,
    description: 'Filter createdAt max date'
  })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  @ApiQuery({
    name: 'labels', required: false, type: String, isArray: true,
    example: "",
    description: "Filter by label id. It can have many labels in 1 request"
  })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  findAll(@AuthUser() authUser: JwtUser,
    @Request() req?: ExRequest,
    @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number) {
    return this.todoDemandService.findAll(authUser, {
      ...req.query,
      limit, offset
    });
  }

  @Get('home')
  findDemands(@AuthUser() userReq: JwtUser) {
    return this.todoDemandService.featuredDemands(userReq);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
    return this.todoDemandService.findOne(id, userReq);
  }
  /**
   * Update demand todo
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() updateTodoDemand: UpdateTodoDemandDto,
    @AuthUser() authUser: JwtUser) {
    return this.todoDemandService.update(id, updateTodoDemand, authUser);
  }

  /**
   * Delete demand todo
   */
  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
    return this.todoDemandService.remove(id, userReq);
  }

  @Post(':id/todos')
  async addRelateTodos(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) todoIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.todoDemandService.addRelateTodo(id, todoIds, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/todos')
  async changeRelateTodos(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) todoIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.todoDemandService.changeRelateTodo(id, todoIds, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/todos')
  async removeRelateCustomers(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) todoIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.todoDemandService.removeReleteTodo(id, todoIds, authUser);
    return new OkRespone({ data: result });
  }

}
