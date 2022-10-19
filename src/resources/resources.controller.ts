import {
  Controller, Get, Post, Body, Param, Delete, Put, DefaultValuePipe, ParseIntPipe,
  Query, Request, UseInterceptors, UploadedFiles, Res
} from '@nestjs/common';
import { Response } from 'express';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResourceType } from './inteface/resourceType';
import { Request as ExRequest } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileFieldNameDto } from 'src/commons/dto/file-upload.dto';
import { OkRespone } from 'src/commons/OkResponse';
import { AllowPublic } from 'src/decors/allow-public.decorator';
import { UpdateS3FileDto } from './dto/update-s3file.dto';

@ApiTags('Resource')
@Controller('resources')
@BearerJwt()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) { }

  @Post()
  create(@Body() createResourceDto: CreateResourceDto, @AuthUser() authUser: JwtUser) {
    return this.resourcesService.create(createResourceDto, authUser);
  }

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ResourceType })
  findAll(@AuthUser() authUser: JwtUser,
    @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
    @Request() req?: ExRequest,
  ) {
    return this.resourcesService.findAll(authUser, { ...req.query, limit, offset });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.resourcesService.findOne(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateResourceDto: UpdateResourceDto,
    @AuthUser() authUser: JwtUser) {
    return this.resourcesService.update(id, updateResourceDto, authUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.resourcesService.remove(id, authUser);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file. Support png, jpg, jpeg',
    type: FileFieldNameDto,
  })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'name', maxCount: 1 },
  ], {
    // fileFilter: multerFileFilter(null),
  }))
  @Post(':id/upload')
  async uploadFile(@Param('id') id: string, @AuthUser() authUser: JwtUser,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
    @Body('name') name: string
  ) {
    const res = await this.resourcesService.uploadFile(id, files.file[0], authUser, name);
    return new OkRespone({ data: res })
  }

  @ApiExcludeEndpoint()
  @AllowPublic()
  @Get(':owner/:type/:id/:filename')
  async getFile(
    @Res() res: Response,
    @Param('id') id: string,
    @Param('owner') owner: string,
    @Param('filename') filename: string,
    @Param('type') type: string,
  ) {
    const url = await this.resourcesService.getSignedUrl(id, owner, type, filename);
    return res.redirect(url);
  }

  @Delete(':id/files/:fileId')
  removeFile(@Param('id') id: string,
    @Param('fileId') fileId: string,
    @AuthUser() authUser: JwtUser) {
    return this.resourcesService.removeFile(id, fileId, authUser);
  }
  @Put(':id/files/:fileId')
  updateFile(@Param('id') id: string,
    @Param('fileId') fileId: string,
    @Body() info: UpdateS3FileDto,
    @AuthUser() authUser: JwtUser) {
    return this.resourcesService.updateFileInfo(id, fileId, info, authUser);
  }
}
