import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ProductStatusService } from './product-status.service';
import { CreateProductStatusDto } from './dto/create-product-status.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decors/roles.decorator';
import { UserRole } from 'src/users/interface/userRoles';

@ApiTags('Product Status')
@Controller('product-status')
@BearerJwt()
export class ProductStatusController {
  constructor(private readonly productStatusService: ProductStatusService) { }

  @Post()
  create(@Body() createProductStatusDto: CreateProductStatusDto, @AuthUser() authUser: JwtUser) {
    return this.productStatusService.create(createProductStatusDto, authUser);
  }

  @Get()
  findAll(@AuthUser() authUser: JwtUser) {
    return this.productStatusService.findAll(authUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.productStatusService.findOne(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProductStatusDto: UpdateProductStatusDto,
    @AuthUser() authUser: JwtUser) {
    return this.productStatusService.update(id, updateProductStatusDto, authUser);
  }

  @Delete(':id')
  // @Roles(UserRole.Admin, UserRole.Owner, UserRole.Manager)
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.productStatusService.remove(id, authUser);
  }
}
