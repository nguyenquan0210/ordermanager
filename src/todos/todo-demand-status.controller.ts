import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CreateLabelDto } from '../labels/dto/create-label.dto';
import { UpdateLabelDto } from '../labels/dto/update-label.dto';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { TodoDemandService } from './todo-demand/todo-demand.service';
import { TodoDemandStatusService } from './todo-demand-status/todo-demand-status.service';
import { UserRole } from 'src/users/interface/userRoles';
import { Roles } from 'src/decors/roles.decorator';

@ApiTags('Todo demand status')
@Controller('demand-status')
@BearerJwt()
export class TodoDemandStatusController {
  constructor(private readonly todoDemandStatusService: TodoDemandStatusService) { }

  @Post()
  create(@Body() createLabelDto: CreateLabelDto, @AuthUser() authUser: JwtUser) {
    return this.todoDemandStatusService.create(createLabelDto, authUser);
  }

  @Get()
  findAll(@AuthUser() authUser: JwtUser) {
    return this.todoDemandStatusService.findAll(authUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.todoDemandStatusService.findOne(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateLabelDto: UpdateLabelDto, @AuthUser() authUser: JwtUser) {
    return this.todoDemandStatusService.update(id, updateLabelDto, authUser);
  }

  @Delete(':id')
  // @Roles(UserRole.Admin, UserRole.Owner, UserRole.Manager)
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.todoDemandStatusService.remove(id, authUser);
  }
}
