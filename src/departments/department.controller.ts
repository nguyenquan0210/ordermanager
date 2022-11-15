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
import { Roles } from 'src/decors/roles.decorator';
import { UserRole } from 'src/users/interface/userRoles';
import { AllowPublic } from 'src/decors/allow-public.decorator';
import { DepartmentsService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { Currency } from './interface/currencies';
import { CreateRelateArrProductDto } from './dto/create-relate-product.dto';

//import { s } from 'api';

//const sdk = require('api')('@fastforex/v1.3.1#asrfjl86128df');


@ApiTags('Department')
@Controller('departments')
@BearerJwt()
export class DepartmentsController {
    constructor(private readonly departmentService: DepartmentsService) { }

    @Post()
    async create(@Body() createDepartmentDto: CreateDepartmentDto, @AuthUser() authUser: JwtUser) {
        const res = await this.departmentService.createDepartment(createDepartmentDto, authUser);
        return new OkRespone({ data: { _id: res._id } });
    }

    @Get()
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'isOwner', required: false, type: Boolean })
    @ApiQuery({ name: 'sortBy', required: false, type: String })
    @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
    @ApiQuery({ name: 'isDeleted', required: false, type: Boolean })
    async findAll(@AuthUser() userReq: JwtUser,
        @Req() req: Request,
        @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
        @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
        @Query('search') search?: string,
    ) {
        return this.departmentService.findAll(userReq, {
            ...req.query,
            search, limit, offset
        });
    }

    @Get('currency')
    @ApiQuery({ name: 'currency', required: false, enum: Currency })
    @ApiQuery({ name: 'money', required: false, type: Number })
    currency(
        @Query('currency') currency?: Currency,
        @Query('money') money?: number,
    ) {
        return this.departmentService.currency(currency, money);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
        return this.departmentService.findOne(id, authUser);
    }

    @Put(':id/request-isDeleted')
    @Roles(UserRole.Admin)
    isDeletedConfirmation(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
        return this.departmentService.isDeletedConfirmation(id, authUser);
    }

    @Delete(':id')
    @Roles(UserRole.Admin)
    remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
        return this.departmentService.remove(id, authUser);
    }
    @Post(':id/products')
    async addRelateProducts(@Param('id') id: string,
      @Body() createRelateArrProductDto: CreateRelateArrProductDto,
      @AuthUser() authUser: JwtUser
    ) {
      const result = await this.departmentService.addRelateProducts(id, createRelateArrProductDto, authUser);
      return new OkRespone({ data: result });
    }
  
    @Delete(':id/products')
    async removeRelateProducts(@Param('id') id: string,
      @Body() productIds: string[],
      @AuthUser() authUser: JwtUser) {
      const result = await this.departmentService.removeRelateProducts(id, productIds, authUser);
      return new OkRespone({ data: result });
    }
}
