import {
    Controller, Get, Post, Body, Param, Delete, Request,
    Put, Query, DefaultValuePipe, ParseIntPipe
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/decors/user.decorator';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { Request as ExRequest } from 'express';
import { SortOrder } from 'src/commons/dto/sorting';
import { UsersService } from './users.service';
import { Roles } from 'src/decors/roles.decorator';
import { UserRole } from './interface/userRoles';

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

}
