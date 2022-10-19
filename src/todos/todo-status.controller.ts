import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CreateLabelDto } from '../labels/dto/create-label.dto';
import { UpdateLabelDto } from '../labels/dto/update-label.dto';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { TodoStatusService } from './todo-status/todo-status.service';
import { UserRole } from 'src/users/interface/userRoles';
import { Roles } from 'src/decors/roles.decorator';

@ApiTags('Todo status')
@Controller('todo-status')
@BearerJwt()
export class TodoStatusController {
  constructor(private readonly todoStatusService: TodoStatusService) { }

  @Post()
  create(@Body() createLabelDto: CreateLabelDto, @AuthUser() authUser: JwtUser) {
    return this.todoStatusService.create(createLabelDto, authUser);
  }

  @Get()
  findAll(@AuthUser() authUser: JwtUser) {
    return this.todoStatusService.findAll(authUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.todoStatusService.findOne(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateLabelDto: UpdateLabelDto, @AuthUser() authUser: JwtUser) {
    return this.todoStatusService.update(id, updateLabelDto, authUser);
  }

  @Delete(':id')
  // @Roles(UserRole.Admin, UserRole.Owner, UserRole.Manager)
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.todoStatusService.remove(id, authUser);
  }
}
