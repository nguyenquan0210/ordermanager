import {
  Controller, Get, Post, Body, Param, Delete, Request,
  Put, UseInterceptors, Query, DefaultValuePipe, ParseIntPipe, Res, UploadedFiles, ParseBoolPipe
} from '@nestjs/common';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { ApiQuery, ApiParam, ApiTags } from '@nestjs/swagger';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { Request as ExRequest } from 'express';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationType } from 'src/commons/enum/notifications/notificationTypeEnum';
import { SortOrder } from 'src/commons/dto/sorting';
import { OkRespone } from 'src/commons/OkResponse';
import { Response } from 'express';
import { FileBodyDto, FileFieldNameDto } from 'src/commons/dto/file-upload.dto';
import { ApiBody, ApiConsumes, ApiExcludeEndpoint } from '@nestjs/swagger';
import { multerFileFilter } from 'src/configs/multer.cnf';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AllowPublic } from 'src/decors/allow-public.decorator';

@ApiTags('Notifications')
@Controller('Notifications')
@BearerJwt()
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) { }

  /**
 * Create notification
 */
  @Post()
  create(@Body() createSpeakersDto: CreateNotificationDto, @AuthUser() authUser: JwtUser) {
    return this.notificationService.createNoti(createSpeakersDto, authUser);
  }

  /**
 * Get All notification
 */
  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'fromDate', required: false, type: Date })
  @ApiQuery({ name: 'toDate', required: false, type: Date })
  @ApiQuery({ name: 'toDateAllNoti', required: false, type: Date })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  @ApiQuery({ name: 'search', required: false, type: String })
  
  findAll(@AuthUser() authUser: JwtUser,
  @Request() req?: ExRequest,
  @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
  @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
  @Query('search') search?: string)
  {
    return this.notificationService.findAll(authUser,{
      ...req.query, search,
      limit, offset
    });
  }

  @Get('notiUnread')
  notiUnread(@AuthUser() authUser: JwtUser) {
    return this.notificationService.notiUnread(authUser);
  } 

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
    return this.notificationService.findOne(id, userReq);
  }

/**
 * update readAll notification
 */
  @Put('readAll')
  updateReadAll(@AuthUser() authUser: JwtUser) {
    return this.notificationService.readAll(authUser);
  }
            
  /**
 * Update notification
 */
  @Put(':id')
  update(@Param('id') id: string, @Body() updateSpeakerDto: UpdateNotificationDto,
  @AuthUser() authUser: JwtUser) {
    return this.notificationService.update(id, updateSpeakerDto, authUser);
  }

  /**
 * Delete notification
 */
  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
    return this.notificationService.remove(id, userReq);
  }

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
  async uploadImage(@Param('id') id: string,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
    @Body('name') name: string,
    @AuthUser() userReq: JwtUser
  ) {
    const result = await this.notificationService.uploadAttachments(id, files.file[0], userReq, name);
    return new OkRespone({ data: result });
  }

   /**
    * Upload documents
    */
   @ApiConsumes('multipart/form-data')
   @ApiBody({
     description: 'Document file. Support doc, docx, xls, xlsx, pps, ppsx, txt, pdf',
     type: FileFieldNameDto,
   })
   @Post(':id/documents')
   @UseInterceptors(FileFieldsInterceptor([
     { name: 'file', maxCount: 1 },
     { name: 'name', maxCount: 1 },
   ], {
     fileFilter: multerFileFilter(['doc', 'docx', 'xls', 'xlsx', 'pps', 'ppsx', 'txt', 'pdf']),
   }))
   async uploadDocuments(@Param('id') id: string,
     @UploadedFiles() files: { file?: Express.Multer.File[] },
     @Body('name') name: string,
     @AuthUser() userReq: JwtUser
   ) {
     const result = await this.notificationService.uploadDocuments(id, files.file[0], userReq, name);
     return new OkRespone({ data: result });
   }

  /**
  * Delete an uploaded file of attachments and documents
  */
 @Delete(':id/attachments/:file')
 @ApiParam({ name: 'id', required: true, description: "Id of notification" })
 @ApiParam({ name: 'file', required: true, description: "Id of attachment in notification" })
 async deleteFile(
   @AuthUser() userReq: JwtUser,
   @Param('id') id: string, @Param('file') fileId: string) {
   const result = await this.notificationService.deleteAttachments(id, fileId, userReq);
   return new OkRespone({ data: result });
 }

 @Delete(':id/documents/:file')
 @ApiParam({ name: 'id', required: true, description: "Id of notification" })
 @ApiParam({ name: 'file', required: true, description: "Id of document in notification" })
 async deleteVideo(
   @AuthUser() userReq: JwtUser,
   @Param('id') id: string, @Param('file') fileId: string) {
   const result = await this.notificationService.deleteDocuments(id, fileId, userReq);
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
    const url = await this.notificationService.getSignedUrl(productId, owner, type, filename);
    return res.redirect(url);
  }
}
    