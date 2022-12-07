import {
  Controller, Get, Post, Body, Param, Delete, Request,
  Put, UseInterceptors, Query, DefaultValuePipe, ParseIntPipe, Res, UploadedFiles, ParseBoolPipe
} from '@nestjs/common';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiParam, ApiQuery, ApiTags
} from '@nestjs/swagger';
import { AuthUser } from 'src/decors/user.decorator';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerFileFilter, multerStorage } from 'src/configs/multer.cnf';
import { OkRespone } from 'src/commons/OkResponse';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ProductAttributeDto } from './dto/update-attr.dto';
import { FileBodyDto, FileFieldNameDto } from 'src/commons/dto/file-upload.dto';
import { AllowPublic } from 'src/decors/allow-public.decorator';
import { Request as ExRequest } from 'express';
import { ArrayObjectIdValidationPipe } from 'src/commons/pipes/array-object-id-validation.pipe';
import { SortOrder } from 'src/commons/dto/sorting';
import { CreateRelateArrDepartmentDto } from './product-department/dto/create-product-rle-arrDepartment.dto';

@ApiTags('Product')
@Controller('products')
@BearerJwt()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  create(@Body() createProductDto: CreateProductDto,
    @AuthUser() userReq: JwtUser) {
    return this.productsService.create(createProductDto, userReq);
  }

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'fromPrice', required: false, type: Number })
  @ApiQuery({ name: 'toPrice', required: false, type: Number })
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'states', required: false, type: String, isArray: true, example: "" })
  @ApiQuery({ name: 'isHot', required: false, type: Boolean })
  @ApiQuery({ name: 'isOwner', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  @ApiQuery({
    name: 'labels', required: false, type: String, isArray: true,
    example: "",
    description: "Filter by label id. It can have many labels in 1 request"
  })
  findAll(@AuthUser() userReq: JwtUser,
    @Request() req?: ExRequest,
    @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
    @Query('fromPrice', new DefaultValuePipe('0'), ParseIntPipe) fromPrice?: number,
    @Query('toPrice', new DefaultValuePipe('0'), ParseIntPipe) toPrice?: number,
    @Query('search') search?: string,
    @Query('category') ctg?: string,
  ) {
    return this.productsService.findAll(userReq, {
      ...req.query,
      search, limit, offset,
      category: ctg,
      fromPrice, toPrice,
    });
  }

  @ApiQuery({ name: 'productCode', required: true, type: String })
  @Get('checkProductCode')
  checkProductCode(@AuthUser() userReq: JwtUser, @Query('productCode') productCode?: string,) {
    return this.productsService.checkProductCode(userReq, productCode);
  }

  @Get('report')
  @ApiQuery({ name: 'year', required: false, type: Date })
  @ApiQuery({ name: 'month', required: false, type: Date })
  @ApiQuery({ name: 'start', required: false, type: Date })
  @ApiQuery({ name: 'end', required: false, type: Date })
  @ApiQuery({ name: 'isMonth', required: false, type: Boolean })
  report(
    @AuthUser() userReq: JwtUser,
    @Query('year') year?: Date,
    @Query('month') month?: Date,
    @Query('start') start?: Date,
    @Query('end') end?: Date,
    @Query('isMonth', new DefaultValuePipe('0'), ParseBoolPipe) isMonth?: Boolean) {
    return this.productsService.report(userReq, { year, month, start, end, isMonth });
  }
  
  @Get('home')
  findProducts(@AuthUser() userReq: JwtUser) {
    return this.productsService.featuredProducts(userReq);
  }

  @Get('transactions')
  transactions(@AuthUser() userReq: JwtUser) {
    return this.productsService.transactions(userReq);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
    return this.productsService.findOne(id, userReq);
  }

  @Put(':id')
  update(@Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @AuthUser() userReq: JwtUser) {
    return this.productsService.update(id, updateProductDto, userReq);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
    return this.productsService.remove(id, userReq);
  }

  /**
   * Upload image
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file. Support png, jpg, jpeg',
    type: FileFieldNameDto,
  })
  @Post(':id/images')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'name', maxCount: 1 },
    { name: 'description', maxCount: 1 },
  ], {
    fileFilter: multerFileFilter(['png', 'jpg', 'jpeg']),
    storage: multerStorage('products')
  }))
  async uploadImage(@Param('id') id: string,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
    @Body('name') name: string,
    @Body('description') description: string,
    @AuthUser() userReq: JwtUser
  ) {
    const result = await this.productsService.uploadImage(id, files.file[0], userReq, name, description);
    return new OkRespone({ data: result });
  }

  /**
   * Upload video
   */
   @ApiConsumes('multipart/form-data')
   @ApiBody({
     description: 'Video file. Support mp4, flv, avi, mkv, wmv, vob, mov',
     type: FileFieldNameDto,
   })
   @Post(':id/videos')
   @UseInterceptors(FileFieldsInterceptor([
     { name: 'file', maxCount: 1 },
     { name: 'name', maxCount: 1 },
   ], {
     fileFilter: multerFileFilter(['mp4','flv','avi', 'mkv', 'wmv', 'vob', 'mov']),
     storage: multerStorage('products')
   }))
   async uploadVideo(@Param('id') id: string,
     @UploadedFiles() files: { file?: Express.Multer.File[] },
     @Body('name') name: string,
     @AuthUser() userReq: JwtUser
   ) {
     const result = await this.productsService.uploadVideo(id, files.file[0], userReq, name);
     return new OkRespone({ data: result });
  }

  /**
   * Upload file
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Normal file.',
    type: FileFieldNameDto,
  })
  @Post(':id/files')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'name', maxCount: 1 },
  ], {
    fileFilter: multerFileFilter(null),
    storage: multerStorage('products')
  }))
  async uploadFile(@Param('id') id: string,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
    @Body('name') name: string,
    @AuthUser() userReq: JwtUser
  ) {
    const result = await this.productsService.uploadFile(id, files.file[0], userReq, name);
    return new OkRespone({ data: result });
  }
  /**
   * Upload any file
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Any file.',
    type: FileFieldNameDto,
  })
  @Post(':id/uploads')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'name', maxCount: 1 },
  ], {
    fileFilter: multerFileFilter(null),
    storage: multerStorage('products')
  }))
  async uploads(@Param('id') id: string,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
    @Body('name') name: string,
    @AuthUser() userReq: JwtUser
  ) {
    const result = await this.productsService.uploads(id, files.file[0], userReq, name);
    return new OkRespone({ data: result });
  }

    //#endregion
  @Put(':id/images/:fileId')
  updateImage(
  @Param('id') id: string, 
  @Param('fileId') fileId: string,
  @AuthUser() authUser: JwtUser,
  @Body() info: FileBodyDto
  ) {
    return this.productsService.updateImage(id, fileId, authUser, info);
  }
  /**
   * Delete an uploaded file of product
   */
  @Delete(':id/files/:file')
  @ApiParam({ name: 'id', required: true, description: "Id of product" })
  @ApiParam({ name: 'file', required: true, description: "Id of file in product" })
  async deleteFile(
    @AuthUser() userReq: JwtUser,
    @Param('id') id: string, @Param('file') fileId: string) {
    const result = await this.productsService.deleteFile(id, fileId, userReq);
    return new OkRespone({ data: result });
  }

  @Delete(':id/videos/:file')
  @ApiParam({ name: 'id', required: true, description: "Id of product" })
  @ApiParam({ name: 'file', required: true, description: "Id of video in product" })
  async deleteVideo(
    @AuthUser() userReq: JwtUser,
    @Param('id') id: string, @Param('file') fileId: string) {
    const result = await this.productsService.deleteVideo(id, fileId, userReq);
    return new OkRespone({ data: result });
  }

  @Delete(':id/images/:file')
  @ApiParam({ name: 'id', required: true, description: "Id of product" })
  @ApiParam({ name: 'file', required: true, description: "Id of image in product" })
  async deleteImage(
    @AuthUser() userReq: JwtUser,
    @Param('id') id: string, @Param('file') fileId: string) {
    const result = await this.productsService.deleteImage(id, fileId, userReq);
    return new OkRespone({ data: result });
  }

  @ApiExcludeEndpoint()
  @Get(':owner/:id/:type/:filename')
  @AllowPublic()
  async getImage(
    @Res() res: Response,
    @Param('id') productId: string,
    @Param('owner') owner: string,
    @Param('filename') filename: string,
    @Param('type') type: string,
  ) {
    const url = await this.productsService.getSignedUrl(productId, owner, type, filename);
    return res.sendFile(url);
  }

  @Get(':id/relateCustomers')
  getNotRelateCustomers(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.productsService.getNotRelateCustomers(id, authUser);
  }

  @Get(':id/relateStaffs')
  getNotRelateStaffs(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.productsService.getNotRelateStaffs(id, authUser);
  }

  //#region Attributes
  /**
   * Remove an optional attribute from product info.
   */
  @ApiParam({ name: 'id', description: 'Id of product' })
  @ApiParam({ name: 'attrId', description: 'Id of attribute' })
  @Delete(':id/attribute/:attrId')
  async deleteAttribute(@Param('id') id: string,
    @Param('attrId') attrId: string,
    @AuthUser() authUser: JwtUser) {
    const result = await this.productsService.deleteAttribute(id, attrId, authUser);
    return new OkRespone({ data: result });
  }
  /**
   * Add/Update an optional attribute from product info.
   */
  @ApiParam({ name: 'id', description: 'Id of product' })
  @Put(':id/attribute')
  async addOrUpdateAttribute(@Param('id') id: string,
    @Body() info: ProductAttributeDto,
    @AuthUser() authUser: JwtUser) {
    const result = await this.productsService.updateAttribute(id, info, authUser);
    return new OkRespone({ data: result });
  }
  //#endregion

  //#region relate staff
  @Post(':id/staffs')
  async addRelateStaffs(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) staffIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.productsService.addRelateStaffs(id, staffIds, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/staffs')
  async updateRelateStaffs(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) staffIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.productsService.updateRelateStaffs(id, staffIds, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/staffs')
  async removeRelateStaffs(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) staffIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.productsService.removeRelateStaff(id, staffIds, authUser);
    return new OkRespone({ data: result });
  }
  //#endregion

  //#region relate Customer
  @Post(':id/customers')
  async addRelateCustomers(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) customerIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.productsService.addRelateCustomers(id, customerIds, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/customers')
  async updateRelateCustomers(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) customerIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.productsService.updateRelateCustomers(id, customerIds, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/customers')
  async removeRelateCustomers(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) customerIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.productsService.removeRelateCustomer(id, customerIds, authUser);
    return new OkRespone({ data: result });
  }
  //#endregion

  //#region relate Todos
  @Post(':id/todos')
  async addRelateTodos(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) todoIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.productsService.addRelateTodos(id, todoIds, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/todos')
  async updateRelateTodos(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) todoIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.productsService.updateRelateTodos(id, todoIds, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/todos')
  async removeRelateTodos(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) todoIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.productsService.removeRelateTodos(id, todoIds, authUser);
    return new OkRespone({ data: result });
  }
  //#endregion

  //#region relate Departments
  @Post(':id/departments')
  async addRelateDepartments(@Param('id') id: string,
  @Body() createRelateArrDepartmentDto: CreateRelateArrDepartmentDto,
    @AuthUser() authUser: JwtUser) {
    const result = await this.productsService.addRelateDepartments(id, createRelateArrDepartmentDto, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/departments')
  async updateRelateDepartments(@Param('id') id: string,
    @Body() createRelateArrDepartmentDto: CreateRelateArrDepartmentDto,
    @AuthUser() authUser: JwtUser) {
    const result = await this.productsService.updateRelateDepartments(id, createRelateArrDepartmentDto, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/departments')
  async removeRelateDepartments(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) todoIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.productsService.removeRelateDepartments(id, todoIds, authUser);
    return new OkRespone({ data: result });
  }
  //#endregion

  //#region relate owner
  @Post(':id/owners')
  async addRelateOwners(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) customerIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.productsService.addRelateOwners(id, customerIds, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/owners')
  async updateRelateOwners(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) customerIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.productsService.updateRelateOwners(id, customerIds, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/owners')
  async removeRelateOwners(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) customerIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.productsService.removeRelateOwners(id, customerIds, authUser);
    return new OkRespone({ data: result });
  }
  //#endregion
}
