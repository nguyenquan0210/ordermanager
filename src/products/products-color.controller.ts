import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CreateLabelDto } from '../labels/dto/create-label.dto';
import { UpdateLabelDto } from '../labels/dto/update-label.dto';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { Roles } from 'src/decors/roles.decorator';
import { UserRole } from 'src/users/interface/userRoles';
import { ProductColorsService } from './products-color/products-color.service';
@ApiTags('Product')
@Controller('products/colors')
@BearerJwt()
export class ColorsController {
  constructor(private readonly colorsService: ProductColorsService) { }

  @Post()
  create(@Body() createLabelDto: CreateLabelDto, @AuthUser() authUser: JwtUser) {       
    return this.colorsService.create(createLabelDto, authUser);
  }

  @Get()
  findAll(@AuthUser() authUser: JwtUser) {
    return this.colorsService.findAll(authUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.colorsService.findOne(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateLabelDto: UpdateLabelDto, @AuthUser() authUser: JwtUser) {
    return this.colorsService.update(id, updateLabelDto, authUser);
  }

  @Delete(':id')
  // @Roles(UserRole.Admin, UserRole.Owner, UserRole.Manager)
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.colorsService.remove(id, authUser);
  }
}
