import {
    Controller, Get, Post, Body, Param, Delete, Req,
    Put, UseInterceptors, Query, DefaultValuePipe, ParseIntPipe, Res, UploadedFiles, ParseBoolPipe
} from '@nestjs/common';
import {
    ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiParam, ApiQuery, ApiTags
} from '@nestjs/swagger';
import { AuthUser } from 'src/decors/user.decorator';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { Request, Response } from 'express';
import { SortOrder } from 'src/commons/dto/sorting';
import { OkRespone } from 'src/commons/OkResponse';
import { FileFieldNameDto } from 'src/commons/dto/file-upload.dto';
import { multerFileFilter } from 'src/configs/multer.cnf';
import { FeedbackStatus } from './interface/feedbackstatus';
import { FeedbacksService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Roles } from 'src/decors/roles.decorator';
import { UserRole } from 'src/users/interface/userRoles';
import { AllowPublic } from 'src/decors/allow-public.decorator';


@ApiTags('Feedback')
@Controller('feedbacks')
@BearerJwt()
export class FeedbacksController {
    constructor(private readonly FeedbackService: FeedbacksService) { }

    @Post()
    async create(@Body() createFeedbackDto: CreateFeedbackDto, @AuthUser() authUser: JwtUser) {
        const res = await this.FeedbackService.createFeedback(createFeedbackDto, authUser);
        return new OkRespone({ data: { _id: res._id } });
    }

    @Get()
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'isOwner', required: false, type: Boolean })
    @ApiQuery({ name: 'sortBy', required: false, type: String })
    @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
    @ApiQuery({ name: 'status', required: false, enum: FeedbackStatus })
    findAll(@AuthUser() userReq: JwtUser,
        @Req() req: Request,
        @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
        @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
        @Query('search') search?: string,
    ) {
        return this.FeedbackService.findAll(userReq, {
            ...req.query,
            search, limit, offset
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
        return this.FeedbackService.findOne(id, authUser);
    }

    @Put(':id/request-Confirmation')
    @Roles(UserRole.Admin)
    requestConfirmation(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
        return this.FeedbackService.requestConfirmation(id, authUser);
    }

    @Delete(':id')
    @Roles(UserRole.Admin)
    remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
        return this.FeedbackService.remove(id, authUser);
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
    }))
    async uploadImage(@Param('id') id: string,
        @UploadedFiles() files: { file?: Express.Multer.File[] },
        @Body('name') name: string,
        @Body('description') description: string,
        @AuthUser() userReq: JwtUser
    ) {
        const result = await this.FeedbackService.uploadImage(id, files.file[0], userReq, name, description);
        return new OkRespone({ data: result });
    }

    @ApiExcludeEndpoint()
    @Get(':owner/:id/images/:filename')
    @AllowPublic()
    async getImage(
        @Res() res: Response,
        @Param('id') feedbackId: string,
        @Param('owner') owner: string,
        @Param('filename') filename: string
    ) {
        const url = await this.FeedbackService.getSignedUrl(feedbackId, owner, filename);
        return res.redirect(url);
    }


}
