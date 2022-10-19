import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { CreateTodoCommentDto, CreateTodoReplyDto } from './dto/create-todo-comment.dto';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { TodoCommentService } from './todo-comment/todo-comment.service';

@ApiTags('Todo')
@Controller('todos/comment')
@BearerJwt()
export class TodoCommentController {
  constructor(private readonly todoCommentService: TodoCommentService) { }

  @Post()
  create(@Body() createTodoCommentDto: CreateTodoCommentDto, @AuthUser() authUser: JwtUser) {
    return this.todoCommentService.create(createTodoCommentDto, authUser);
  }

  @Post('reply')
  createReply(@Body() createTodoReplyDto: CreateTodoReplyDto, @AuthUser() authUser: JwtUser) {
    return this.todoCommentService.createReply(createTodoReplyDto, authUser);
  }

  @Get()
  @ApiQuery({ name: 'idTodo', required: false, type: String })
  findAll(@AuthUser() authUser: JwtUser, @Query('idTodo') idTodo?: string,) {
    return this.todoCommentService.findAll(idTodo, authUser);
  }

  // @Get(':id')
  // @ApiQuery({ name: 'status', required: false, type: String })
  // findAll(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
  //   return this.todoCommentService.findCommentTodo(idTodo, authUser);
  // }

  // @Put(':id')
  // update(@Param('id') id: string, @Body() updateLabelDto: UpdateLabelDto, @AuthUser() authUser: JwtUser) {
  //   return this.labelsService.update(id, updateLabelDto, authUser);
  // }

  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.todoCommentService.remove(id, authUser);
  }
}
