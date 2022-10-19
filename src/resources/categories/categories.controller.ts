import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { AuthUser } from 'src/decors/user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Resource')
@Controller('resources/categories')
@BearerJwt()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto, @AuthUser() authUser: JwtUser) {
    return this.categoriesService.create(createCategoryDto, authUser);
  }

  @Get()
  findAll(@AuthUser() authUser: JwtUser,) {
    return this.categoriesService.findAll(authUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.categoriesService.findOne(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto,
    @AuthUser() authUser: JwtUser) {
    return this.categoriesService.update(id, updateCategoryDto, authUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.categoriesService.remove(id, authUser);
  }
}
