import {
  Controller, Get, Post, Body, Put, Param, Delete, DefaultValuePipe, ParseIntPipe,
  Query, UseInterceptors, Res, UploadedFiles, Req
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { TodoPriority } from './interface/todo-status';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerFileFilter } from 'src/configs/multer.cnf';
import { OkRespone } from 'src/commons/OkResponse';
import { ArrayObjectIdValidationPipe } from 'src/commons/pipes/array-object-id-validation.pipe';
import { FileFieldNameDto } from 'src/commons/dto/file-upload.dto';
import { AllowPublic } from 'src/decors/allow-public.decorator';
import { TodoTarget } from './interface/todo-target';
import { SortOrder } from 'src/commons/dto/sorting';

@ApiTags('Todo')
@Controller('todos')
@BearerJwt()
export class TodosController {
  constructor(private readonly todosService: TodosService) { }

  @Post()
  create(@Body() createTodoDto: CreateTodoDto, @AuthUser() authUser: JwtUser) {
    return this.todosService.create(createTodoDto, authUser);
  }

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, enum: TodoPriority })
  @ApiQuery({ name: 'target', required: false, enum: TodoTarget })
  @ApiQuery({ name: 'assignee', required: false, type: String, isArray: true, example: "" })
  @ApiQuery({ name: 'fromDate', required: false, type: Date, example: '' })
  @ApiQuery({ name: 'toDate', required: false, type: Date, example: '' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: '' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({
    name: 'labels', required: false, type: String, isArray: true,
    example: "",
    description: "Filter by label id. It can have many labels in 1 request"
  })
  @ApiQuery({
    name: 'staffId', required: false, type: String, isArray: true,
    example: "",
    description: "staffId"
  })
  findAll(@AuthUser() authUser: JwtUser,
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
    @Query('status') status?: string,
    @Query('priority') priority?: TodoPriority,
    @Query('assignee') assignee?: string[],
    @Query('search') search?: string,
  ) {
    return this.todosService.findAll(authUser, { ...req.query, search, limit, offset, status, priority, assignee });
  }

  @Get('/targets')
  numberOfTarget(@AuthUser() authUser: JwtUser) {
    return this.todosService.countTarget(authUser);
  }

  @Get('/home')
  todayJob(@AuthUser() authUser: JwtUser) {
    return this.todosService.todoCurent(authUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.todosService.findOne(id, authUser);
  }

  @Get(':id/relateProducts')
  getNotRelateProduct(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.todosService.getNotRelateProduct(id, authUser);
  }

  @Get(':id/relateCustomers')
  getNotRelateCustomers(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.todosService.getNotRelateCustomer(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto, @AuthUser() authUser: JwtUser) {
    return this.todosService.update(id, updateTodoDto, authUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.todosService.remove(id, authUser);
  }

  /**
   * Upload file attachment
   */
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   description: 'Normal file. Support png, jpg, txt, pdf, mp3',
  //   type: FileFieldNameDto,
  // })
  // @Post(':id/attachments')
  // @UseInterceptors(FileFieldsInterceptor([
  //   { name: 'file', maxCount: 1 },
  //   { name: 'name', maxCount: 1 },
  // ], {
  //   fileFilter: multerFileFilter(['png', 'jpg', 'jpeg', 'txt', 'pdf', 'mp3']),
  // }))
  // async uploadAttachment(@Param('id') id: string,
  //   @UploadedFiles() files: { file?: Express.Multer.File[] },
  //   @Body('name') name: string,
  //   @AuthUser() authUser: JwtUser
  // ) {
  //   const result = await this.todosService.addAttachment(id, files.file[0], authUser, name);
  //   return new OkRespone({ data: result });
  // }

  // @Get(':owner/:id/attachment/:filename')
  // @AllowPublic()
  // @ApiExcludeEndpoint()
  // async getAttachFile(
  //   @Res() res: Response,
  //   @Param('id') todoId: string,
  //   @Param('owner') owner: string,
  //   @Param('filename') filename: string,
  // ) {
  //   const url = await this.todosService.getSignedUrl(owner, todoId, filename);
  //   return res.redirect(url);
  // }

  // @Put(':id/changeNameAttachment/:fileId/:filename')
  // async chaneNameAttachment(@Param('id') id: string,
  //   @Param('fileId') fileId: string,
  //   @Param('filename') filename: string,
  //   @AuthUser() authUser: JwtUser
  // ) {
  //   const result = await this.todosService.changeAttachment(id, fileId, authUser, filename);
  //   return new OkRespone({ data: result });
  // }

  // @Delete(':id/attachments/:fileId')
  // async removeAttachment(@Param('id') id: string,
  //   @Param('fileId') fileId: string,
  //   @AuthUser() authUser: JwtUser
  // ) {
  //   const result = await this.todosService.removeAttachment(id, fileId, authUser);
  //   return new OkRespone({ data: result });
  // }

  @Post(':id/products')
  async addRelateProducts(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) productIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.todosService.addRelateProducts(id, productIds, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/products')
  async removeRelateProducts(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) productIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.todosService.removeRelateProducts(id, productIds, authUser);
    return new OkRespone({ data: result });
  }
  
  @Post(':id/customers')
  async addRelateCustomers(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) customerIds: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.todosService.addRelateCustomers(id, customerIds, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/customers')
  async removeRelateCustomers(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) customerIds: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.todosService.removeRelateCustomer(id, customerIds, authUser);
    return new OkRespone({ data: result });
  }

  @Post(':id/demands')
  async addRelateDemands(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) demandIs: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.todosService.addRelateDemands(id, demandIs, authUser);
    return new OkRespone({ data: result });
  }

  @Put(':id/demands')
  async changeRelateDemands(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) demandIs: string[],
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.todosService.changeRelateDemands(id, demandIs, authUser);
    return new OkRespone({ data: result });
  }

  @Delete(':id/demands')
  async removeRelateDemands(@Param('id') id: string,
    @Body(ArrayObjectIdValidationPipe) demandIs: string[],
    @AuthUser() authUser: JwtUser) {
    const result = await this.todosService.removeReleteDemands(id, demandIs, authUser);
    return new OkRespone({ data: result });
  }
}
