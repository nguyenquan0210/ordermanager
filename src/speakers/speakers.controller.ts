  import {
  Controller, Get, Post, Body, Param, Delete, Request,
  Put, UseInterceptors, Query, DefaultValuePipe, ParseIntPipe, Res, UploadedFiles
  } from '@nestjs/common';
  import { Response } from 'express';
  import { SpeakersService } from './speakers.service';
  import { CreateSpeakersDto } from './dto/create-speaker.dto'
  import { JwtUser } from 'src/auth/inteface/jwtUser';
  import { AuthUser } from 'src/decors/user.decorator';
  import { ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiQuery, ApiTags, ApiParam } from '@nestjs/swagger';
  import { OkRespone } from 'src/commons/OkResponse';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { multerFileFilter } from 'src/configs/multer.cnf';
  import { FileUploadDto } from 'src/commons/dto/file-upload.dto';
  import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
  import { AllowPublic } from 'src/decors/allow-public.decorator';
  import { FileFieldNameDto } from 'src/commons/dto/file-upload.dto';
  import { FileFieldsInterceptor } from '@nestjs/platform-express';
  import { Request as ExRequest } from 'express';
  import { UpdateSpeakerDto } from './dto/update-speaker.dto';

  @ApiTags('Speakers')
  @Controller('speakers')
  @BearerJwt()
  export class SpeakersController {
    constructor(private readonly speakersService: SpeakersService) { }
  
    /**
   * Create speaker
   */
    @Post()
    create(@Body() createSpeakersDto: CreateSpeakersDto, @AuthUser() authUser: JwtUser) {
      return this.speakersService.create(createSpeakersDto, authUser);
    }
  
    /**
   * Get All speaker
   */
    @Get()
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    
    findAll(@AuthUser() authUser: JwtUser,
    @Request() req?: ExRequest,
    @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number) 
    {
      return this.speakersService.findAll(authUser,{
        ...req.query,
        limit, offset
      });
    }

    @Get(':id')
    findOne(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
      return this.speakersService.findOne(id, userReq);
    }

    /**
   * Update speaker
   */
    @Put(':id')
    update(@Param('id') id: string, @Body() updateSpeakerDto: UpdateSpeakerDto,
    @AuthUser() authUser: JwtUser) {
      return this.speakersService.update(id, updateSpeakerDto, authUser);
    }

    /**
   * Delete speaker
   */
    @Delete(':id')
    remove(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
      return this.speakersService.remove(id, userReq);
    }
    
    /**
   * Upload attachments
   */
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      description: 'Image file. Support png, jpg, jpeg, mp4',
      type: FileFieldNameDto,
    })
    @Post(':id/attachments')
    @UseInterceptors(FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'name', maxCount: 1 },
    ], {
      fileFilter: multerFileFilter(['png', 'jpg', 'jpeg', 'mp4']),
    }))
    async uploadAttachment(@Param('id') id: string,
      @UploadedFiles() files: { file?: Express.Multer.File[] },
      @Body('name') name: string,
      @AuthUser() userReq: JwtUser
    ) {
      const result = await this.speakersService.uploadAttachments(id, files.file[0], userReq, name);
      return new OkRespone({ data: result });
    }

    /**
     * Upload documents
     */
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      description: 'Document file. Support doc, docx, xls, xlsx, pps, ppsx, txt',
      type: FileFieldNameDto,
    })
    @Post(':id/documents')
    @UseInterceptors(FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'name', maxCount: 1 },
    ], {
      fileFilter: multerFileFilter(['doc', 'docx', 'xls', 'xlsx', 'pps', 'ppsx', 'txt']),
    }))
    async uploadDocuments(@Param('id') id: string,
      @UploadedFiles() files: { file?: Express.Multer.File[] },
      @Body('name') name: string,
      @AuthUser() userReq: JwtUser
    ) {
      const result = await this.speakersService.uploadDocuments(id, files.file[0], userReq, name);
      return new OkRespone({ data: result });
    }

    /**
   * Delete an uploaded file of attachments and documents
   */
  @Delete(':id/attachments/:file')
  @ApiParam({ name: 'id', required: true, description: "Id of speaker" })
  @ApiParam({ name: 'file', required: true, description: "Id of attachment in speaker" })
  async deleteFile(
    @AuthUser() userReq: JwtUser,
    @Param('id') id: string, @Param('file') fileId: string) {
    const result = await this.speakersService.deleteAttachments(id, fileId, userReq);
    return new OkRespone({ data: result });
  }

  @Delete(':id/documents/:file')
  @ApiParam({ name: 'id', required: true, description: "Id of speaker" })
  @ApiParam({ name: 'file', required: true, description: "Id of document in speaker" })
  async deleteVideo(
    @AuthUser() userReq: JwtUser,
    @Param('id') id: string, @Param('file') fileId: string) {
    const result = await this.speakersService.deleteDocuments(id, fileId, userReq);
    return new OkRespone({ data: result });
  }

}
  