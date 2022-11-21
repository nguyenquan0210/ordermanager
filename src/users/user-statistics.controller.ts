import {
    Controller, Get, Post, Body, Param, Delete, Req,
    Put, UseInterceptors, Query, DefaultValuePipe, ParseIntPipe, Res, UploadedFiles, ParseBoolPipe
} from '@nestjs/common';
import {
    ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiParam, ApiQuery, ApiTags
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthUser } from 'src/decors/user.decorator';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { Request as ExRequest } from 'express';
import { SortOrder } from 'src/commons/dto/sorting';
import { UsersService } from './users.service';
import { Roles } from 'src/decors/roles.decorator';
import { UserRole } from './interface/userRoles';
import { FileFieldNameDto, FileUploadDto } from 'src/commons/dto/file-upload.dto';
import { multerFileFilter } from 'src/configs/multer.cnf';

@ApiTags('Statistics')
@Controller('statistics/users')
@BearerJwt()
export class StatisticsController {
    constructor(private readonly usersService: UsersService) { }

    @Get('count-user')
    @Roles(UserRole.Admin)
    @ApiQuery({ name: 'date', required: false, type: Date })
    CountUser(@AuthUser() userReq: JwtUser,
        //@Query('userId') userId?: string,
        @Query('date') date?: Date,
    ) {
        return this.usersService.countUserMonth(userReq, date);
    }

    @Get('month')
    @Roles(UserRole.Admin)
    @ApiQuery({ name: 'date', required: false, type: Date })
    findAllUserMonth(@AuthUser() userReq: JwtUser,
        //@Query('userId') userId?: string,
        @Query('date') date?: Date,
    ) {
        return this.usersService.findAllUserMonth(userReq, date);
    }


    @Get('year')
    @Roles(UserRole.Admin)
    @ApiQuery({ name: 'date', required: false, type: Date })
    findAllUserYear(@AuthUser() userReq: JwtUser,
        @Query('date') date?: Date,
    ) {
        return this.usersService.findAllUserYear(userReq, date);
    }

    /**
  * Upload image
  */
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Normal file.',
        type: FileUploadDto,
    })
    @Post('testExcelToJson')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'file', maxCount: 1 },
    ], {
        fileFilter: multerFileFilter(null),
    }))
    //@Get('testExcelToJson')
    @Roles(UserRole.Admin)
    testExcelToJson(
        @UploadedFiles() files: { file?: Express.Multer.File[] },
    ) {
        return this.usersService.testExcelToJson(files.file[0]);
    }

}
