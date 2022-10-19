import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CreateLabelDto } from '../labels/dto/create-label.dto';
import { UpdateLabelDto } from '../labels/dto/update-label.dto';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { OrderLabelService } from './order-label/order-label.service';
import { Roles } from 'src/decors/roles.decorator';
import { UserRole } from 'src/users/interface/userRoles';

@ApiTags('Order')
@Controller('orders/labels')
@BearerJwt()
export class LabelsController {
  constructor(private readonly labelsService: OrderLabelService) { }

  @Post()
  create(@Body() createLabelDto: CreateLabelDto, @AuthUser() authUser: JwtUser) {
    return this.labelsService.create(createLabelDto, authUser);
  }

  @Get()
  findAll(@AuthUser() authUser: JwtUser) {
    return this.labelsService.findAll(authUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.labelsService.findOne(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateLabelDto: UpdateLabelDto, @AuthUser() authUser: JwtUser) {
    return this.labelsService.update(id, updateLabelDto, authUser);
  }

  @Delete(':id')
  // @Roles(UserRole.Admin, UserRole.Owner, UserRole.Manager)
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.labelsService.remove(id, authUser);
  }
}
