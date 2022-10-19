import {
  Controller, Get, Post, Body, Param, Delete, Put, Req,
  UploadedFile, UseInterceptors, Query, DefaultValuePipe, ParseIntPipe, Res, UploadedFiles
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { FileUploadDto } from 'src/commons/dto/file-upload.dto';
import { OkRespone } from 'src/commons/OkResponse';
import { multerFileFilter } from 'src/configs/multer.cnf';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { AuthUser } from 'src/decors/user.decorator';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerAttributeDto } from './dto/update-attr.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AllowPublic } from 'src/decors/allow-public.decorator';
import { SortOrder } from 'src/commons/dto/sorting';
import { ArrayObjectIdValidationPipe } from 'src/commons/pipes/array-object-id-validation.pipe';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileFieldNameDto, FileBodyDto } from 'src/commons/dto/file-upload.dto';

@ApiTags('Customer')
@Controller('customers')
@BearerJwt()
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService) { }

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto, @AuthUser() authUser: JwtUser) {
    return this.customerService.create(createCustomerDto, authUser);
  }

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'fromDate', required: false, type: Date })
  @ApiQuery({ name: 'toDate', required: false, type: Date })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  @ApiQuery({ name: 'labels', required: false, type: String, isArray: true, example: "" })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'demands', required: false, type: String, isArray: true })
  @ApiQuery({ name: 'country', required: false, type: String})
  @ApiQuery({ name: 'addressCity', required: false, type: String})
  @ApiQuery({ name: 'addressDistrict', required: false, type: String})
  findAll(@AuthUser() authUser: JwtUser,
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
    @Query('search') search?: string,
    @Query('labels') labels?: string[],
  ) {
    return this.customerService.findAll(authUser, { ...req.query, limit, offset, search, labels });
  }

  @Get('checkCustomerExisted')
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'phone', required: false, type: String })
  checkCustomerExisted(@AuthUser() authUser: JwtUser,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    
    return this.customerService.checkCustomerExisted(authUser, email, phone);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.customerService.findOne(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto,
    @AuthUser() authUser: JwtUser) {
    return this.customerService.update(id, updateCustomerDto, authUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.customerService.remove(id, authUser);
  }

  @Get(':id/not-relateProducts')
  getNotRelateProduct(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.customerService.getNotRelateProducts(id, authUser);
  }

  @Get(':id/not-relateTodos')
  getNotRelateTodos(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.customerService.getNotRelateTodos(id, authUser);
  }

  @Get(':id/not-relateStaffs')
  getNotRelateStaffs(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.customerService.getNotRelateStaffs(id, authUser);
  }

  /**
   * Upload avatar
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file. Support png, jpg',
    type: FileUploadDto,
  })
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: multerFileFilter(['png', 'jpg']),
  }))
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @AuthUser() authUser: JwtUser,
  ) {
    const result = await this.customerService.uploadAvatar(id, file, authUser);
    return new OkRespone({ data: { _id: result._id, avatar: result.avatar } });
  }

  @ApiExcludeEndpoint()
  @Get('avatars/:id/:filename')
  @AllowPublic()
  async getAvatar(
    @Res() res: Response,
    @Param('id') id: string,
    @Param('filename') filename: string,
  ) {
    const url = await this.customerService.getAvatarSignedUrl(id, filename);
    return res.redirect(url);
  }

  // @ApiExcludeEndpoint()
  // @Get(':owner/:id/images/:filename')
  // @AllowPublic()
  // async getImage(
  //   @Res() res: Response,
  //   @Param('id') customerId: string,
  //   @Param('owner') owner: string,
  //   @Param('filename') filename: string
  // ) {
  //   const url = await this.customerService.geImageSignedUrl(customerId, owner, filename);
  //   return res.redirect(url);
  // }

  /**
   * Remove an optional attribute from customer info.
   */
  @ApiParam({ name: 'id', description: 'Id of customer' })
  @ApiParam({ name: 'attrId', description: 'Id of attribute' })
  @Delete(':id/attribute/:attrId')
  async deleteAttribute(@Param('id') id: string,
    @Param('attrId') attrId: string,
    @AuthUser() authUser: JwtUser) {
    const result = await this.customerService.deleteAttribute(id, attrId, authUser);
    return new OkRespone({ data: result });
  }

  /**
   * Add/Update an optional attribute from customer info.
   */
  @ApiParam({ name: 'id', description: 'Id of customer' })
  @Put(':id/attribute')
  async addOrUpdateAttribute(@Param('id') id: string,
    @Body() info: CustomerAttributeDto,
    @AuthUser() authUser: JwtUser) {
    const result = await this.customerService.updateAttribute(id, info, authUser);
    return new OkRespone({ data: result });
  }

  @Post(':id/staffs')
  async addRelateStaffs(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) staffIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.customerService.addRelateStaffs(id, staffIds, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/staffs')
  async updateRelateStaffs(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) staffIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.customerService.updateRelateStaffs(id, staffIds, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/staffs')
  async removeRelateStaffs(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) staffIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.customerService.removeRelateStaffs(id, staffIds, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/staffs')
  async changeRelateStaffs(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) staffIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.customerService.changeRelateStaffs(id, staffIds, authUser);
    return new OkRespone({ data: result });
  }

  //#region relate Product
  @Post(':id/products')
  async addRelateProducts(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) productIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.customerService.addRelateProduct(id, productIds, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/products')
  async updateRelateProducts(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) productIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.customerService.updateRelateProduct(id, productIds, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/products')
  async removeRelateProducts(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) productIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.customerService.removeRelateProduct(id, productIds, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/products')
  async changeRelateProducts(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) productIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.customerService.changeRelateProducts(id, productIds, authUser);
    return new OkRespone({ data: result });
  }
  //#endregion

  //#region relate Todos
  @Post(':id/todos')
  async addRelateTodos(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) todoIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.customerService.addRelateTodos(id, todoIds, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/todos')
  async updateRelateTodos(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) todoIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.customerService.updateRelateTodos(id, todoIds, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/todos')
  async removeRelateTodos(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) todoIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.customerService.removeRelateTodos(id, todoIds, authUser);
    return new OkRespone({ data: result });
  }
  //#endregion
  /**
  * upload images
  */

  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   description: 'Any file.',
  //   type: FileFieldNameDto,
  // })
  // @Post(':id/images')
  // @UseInterceptors(FileFieldsInterceptor([
  //   { name: 'file', maxCount: 1 },
  //   { name: 'name', maxCount: 1 },
  //   { name: 'description', maxCount: 1 },
  // ], {
  //   fileFilter: multerFileFilter(null),
  // }))
  // async uploadImage(@Param('id') id: string, @AuthUser() authUser: JwtUser,
  //   @UploadedFiles() files: { file?: Express.Multer.File[] },
  //   @Body('name') name: string,
  //   @Body('description') description: string,
  // ) {
  //   const res = await this.customerService.uploadImage(id, files.file[0], authUser, name, description);
  //   return new OkRespone({ data: res })
  // }

  // @Put(':id/images/:fileId')
  // updateImage(
  //   @Param('id') id: string,
  //   @Param('fileId') fileId: string,
  //   @AuthUser() authUser: JwtUser,
  //   @Body() info: FileBodyDto
  // ) {
  //   return this.customerService.updateImage(id, fileId, authUser, info);
  // }

  // @Delete(':id/images/:fileId')
  // removeImage(
  //   @Param('id') id: string,
  //   @Param('fileId') fileId: string,
  //   @AuthUser() authUser: JwtUser) {
  //   return this.customerService.deleteImage(id, fileId, authUser);
  // }

  //#region Demands
  @Post(':id/demands')
  async addDemands(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) demandIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.customerService.addDemands(id, demandIds, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/demands')
  async changeDemands(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) demandIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.customerService.changeDemands(id, demandIds, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/demands')
  async removeDemands(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) demandIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.customerService.removeDemands(id, demandIds, authUser);
    return new OkRespone({ data: result });
  }
  //#endregion
}
