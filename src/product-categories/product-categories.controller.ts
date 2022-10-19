import {
  Controller, Get, Post, Body, Param, Delete, DefaultValuePipe, ParseIntPipe,
  Query, Put, UploadedFile, UseInterceptors, Res
} from '@nestjs/common';
import { Response } from 'express';
import { ProductCategoriesService } from './product-categories.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OkRespone } from 'src/commons/OkResponse';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerFileFilter } from 'src/configs/multer.cnf';
import { FileUploadDto } from 'src/commons/dto/file-upload.dto';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { AllowPublic } from 'src/decors/allow-public.decorator';
import { Roles } from 'src/decors/roles.decorator';
import { UserRole } from 'src/users/interface/userRoles';

@ApiTags('Product Category')
@Controller('product-ctgs')
@BearerJwt()
export class ProductCategoriesController {
  constructor(private readonly productCategoriesService: ProductCategoriesService) { }

  @Post()
  create(@Body() createProductCategoryDto: CreateProductCategoryDto, @AuthUser() authUser: JwtUser) {
    return this.productCategoriesService.create(createProductCategoryDto, authUser);
  }

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@AuthUser() authUser: JwtUser,
    @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
    @Query('search') search?: string
  ) {
    return this.productCategoriesService.findAll(authUser, { limit, offset, search });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.productCategoriesService.findOne(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProductCategoryDto: UpdateProductCategoryDto,
    @AuthUser() authUser: JwtUser) {
    return this.productCategoriesService.update(id, updateProductCategoryDto, authUser);
  }

  @Delete(':id')
  // @Roles(UserRole.Admin, UserRole.Owner, UserRole.Manager)
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.productCategoriesService.remove(id, authUser);
  }

  /** 
   * Upload icon for product category
   */
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   description: 'Image file. Support png, jpg, webp',
  //   type: FileUploadDto,
  // })
  // @Post(':id/icon')
  // @UseInterceptors(FileInterceptor('file', {
  //   fileFilter: multerFileFilter(['png', 'jpg', 'jpeg', 'webp']),
  // }))
  // async uploadAvatar(@Param('id') id: string,
  //   @UploadedFile() file: Express.Multer.File,
  //   @AuthUser() authUser: JwtUser
  // ) {
  //   const result = await this.productCategoriesService.uploadIcon(id, file, authUser);
  //   return new OkRespone({ data: { _id: result._id, icon: result.icon } });
  // }

  // @ApiExcludeEndpoint()
  // @Get('icons/:owner/:id/:filename')
  // @AllowPublic()
  // async getIcon(
  //   @Res() res: Response,
  //   @Param('owner') owner: string,
  //   @Param('id') ctgId: string,
  //   @Param('filename') filename: string
  // ) {
  //   const url = await this.productCategoriesService.getIcon(owner, ctgId, filename);
  //   return res.redirect(url);
  // }
}
