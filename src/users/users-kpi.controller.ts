import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { UserKPIService } from './user-kpi/user-kpi.service';
import { CreateUserKPIDto } from './dto/create-user-kpi.dto';
import { UpdateUserKPIDto } from './dto/update-user-kpi.dto';

@ApiTags('User')
@Controller('users/kpi')
@BearerJwt()
export class UserKPIController {
  constructor(private readonly userKPIService: UserKPIService) { }

  @Post()
  create(@Body() createUserKPIDto: CreateUserKPIDto, @AuthUser() authUser: JwtUser) {
    return this.userKPIService.create(createUserKPIDto, authUser);
  }

  @Get()
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: Date })
  findAll(@AuthUser() authUser: JwtUser, @Query('userId') userId?: string, @Query('date') date?: Date) {
    return this.userKPIService.findAll(authUser, userId, date);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.userKPIService.findOne(id, authUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserKPIDto: UpdateUserKPIDto, @AuthUser() authUser: JwtUser) {
    return this.userKPIService.update(id, updateUserKPIDto, authUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
    return this.userKPIService.remove(id, authUser);
  }
}
