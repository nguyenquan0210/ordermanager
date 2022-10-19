  import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
  import { SpeakerStylesService } from './speaker-styles.service';
  import { CreateSpeakerStylesDto } from './dto/create-speaker-style.dto'
  import { JwtUser } from 'src/auth/inteface/jwtUser';
  import { AuthUser } from 'src/decors/user.decorator';
  import { ApiTags } from '@nestjs/swagger';
  import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
  import { UpdateSpeakerStyleDto } from './dto/update-speaker-style.dto';
  
  @ApiTags('Speaker style')
  @Controller('speaker/styles')
  @BearerJwt()
  export class SpeakerStylesController {
    constructor(private readonly speakerStylesService: SpeakerStylesService) { }
  
    @Post()
    create(@Body() createSpeakerStylesDto: CreateSpeakerStylesDto, @AuthUser() authUser: JwtUser) {
      return this.speakerStylesService.create(createSpeakerStylesDto, authUser);
    }
  
    @Get()
    findAll(@AuthUser() authUser: JwtUser) {
      return this.speakerStylesService.findAll(authUser);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
      return this.speakerStylesService.findOne(id, userReq);
    }

    /**
   * Update speaker
   */
    @Put(':id')
    update(@Param('id') id: string, @Body() updateSpeakerStyleDto: UpdateSpeakerStyleDto,
    @AuthUser() authUser: JwtUser) {
      return this.speakerStylesService.update(id, updateSpeakerStyleDto, authUser);
    }

    /**
   * Delete speaker
   */
    @Delete(':id')
    remove(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
      return this.speakerStylesService.remove(id, userReq);
    }
  }
  