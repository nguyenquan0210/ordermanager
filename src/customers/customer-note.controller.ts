import { Controller, Get, Post, Body, Put, Param, Delete, Req, DefaultValuePipe, ParseIntPipe, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { CustomerNoteService } from './customer-note/customer-note.service';
import { CreateCustomerNoteDto } from './customer-note/dto/create-customer-note.dto';
import { UpdateCustomerNoteDto } from './customer-note/dto/update-customer-note.dto';
import { Request } from 'express';

@ApiTags('Customer')
@Controller('customers/notes')
@BearerJwt()
export class CustomerNoteController {
    constructor(private readonly noteService: CustomerNoteService) { }

    @Get()
    @ApiQuery({ name: 'customer', required: true, type: String, description: 'only get note for a customer' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    findAll(
        @AuthUser() authUser: JwtUser,
        @Req() req: Request,
        @Query('customer') customer: string,
        @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
        @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
    ) {
        return this.noteService.findAll(authUser, { ...req.query, limit, offset, customer });
    }

    @Post()
    create(@Body() createLabelDto: CreateCustomerNoteDto, @AuthUser() authUser: JwtUser) {
        return this.noteService.create(createLabelDto, authUser);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.noteService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string,
        @Body() dto: UpdateCustomerNoteDto,
        @AuthUser() authUser: JwtUser,
    ) {
        return this.noteService.update(id, dto, authUser);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @AuthUser() authUser: JwtUser) {
        return this.noteService.remove(id, authUser);
    }
}