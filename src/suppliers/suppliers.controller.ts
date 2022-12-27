import {
  Controller, Get, Post, Body, Param, Delete, DefaultValuePipe, ParseIntPipe,
  Query, Put, Res, Req, UploadedFile, UseInterceptors
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthUser } from 'src/decors/user.decorator';
import { ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { Roles } from 'src/decors/roles.decorator';
import { UserRole } from 'src/users/interface/userRoles';
import { SuppliersService } from './suppliers.service';
import { CreateSuppliersDto } from './dto/create-suppliers.dto';
import { UpdateSuppliersDto } from './dto/update-suppliers.dto';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { Status } from 'src/commons/enum/status.enum';
import { SortOrder } from 'src/commons/dto/sorting';


@ApiTags('Suppliers')
@Controller('suppliers')
@BearerJwt()
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) { }

  @Post()
  //@Roles(UserRole.Admin)
  create(@Body() createSuppliersDto: CreateSuppliersDto, @AuthUser() authUser: JwtUser) {
    return this.suppliersService.create(createSuppliersDto, authUser);
  }

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: Status })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  findAll(@AuthUser() authUser: JwtUser,
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
    @Query('search') search?: string,
    @Query('status') status?: Status,
  ) {
    return this.suppliersService.findAll(authUser, { ...req.query, limit, offset, search, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.suppliersService.findOne(id, authUser);
  }

  @Put(':id')
  //@Roles(UserRole.Admin)
  update(@Param('id') id: string, @Body() updateSuppliersDto: UpdateSuppliersDto,
    @AuthUser() authUser: JwtUser) {
    return this.suppliersService.update(id, updateSuppliersDto, authUser);
  }

  @Delete(':id')
  //@Roles(UserRole.Admin)
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.suppliersService.remove(id, authUser);
  }

}
