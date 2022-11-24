import {
    Controller, Get, Post, Body, Param, Delete, Request,
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
import { Roles } from 'src/decors/roles.decorator';
import { FileFieldNameDto, FileUploadDto } from 'src/commons/dto/file-upload.dto';
import { multerFileFilter } from 'src/configs/multer.cnf';
import { ProductsService } from './products.service';

@ApiTags('Product Client')
@Controller('client')
//@BearerJwt()
export class ClientsController {
    constructor(private readonly productsService: ProductsService) { }

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
      return this.productsService.findAllClient({
        ...req.query,
        search, limit, offset,
        category: ctg,
        fromPrice, toPrice,
      });
    }

}
