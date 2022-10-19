import {
  Controller, Get, Post, Body, Put, Param, Delete,
  Inject, BadRequestException, Query
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { AuthUser } from 'src/decors/user.decorator';
import { AttributesDynamicService } from './attribute-dynamic.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { AttrSubject } from './interface/attrSubject';

@Controller('attributes')
@ApiTags('Attribute')
@BearerJwt()
export class AttributesController {
  private services = new Map<string, AttributesDynamicService>();
  constructor(
    @Inject(AttrSubject.User) private userAttrService: AttributesDynamicService,
    @Inject(AttrSubject.Product) private productAttrService: AttributesDynamicService,
    @Inject(AttrSubject.Customer) private customerAttrService: AttributesDynamicService,

  ) {
    this.services.set(AttrSubject.User, this.userAttrService);
    this.services.set(AttrSubject.Product, this.productAttrService);
    this.services.set(AttrSubject.Customer, this.customerAttrService);
  }

  private getService(name: AttrSubject) {
    const svc = this.services.get(name);
    if (!svc) {
      throw new BadRequestException("No support for " + name);
    }
    return svc;
  }

  @ApiParam({ name: 'subject', enum: AttrSubject })
  @Post(':subject')
  create(
    @Param('subject') subject: AttrSubject,
    @Body() createAttributeDto: CreateAttributeDto,
    @AuthUser() userReq: JwtUser) {
    return this.getService(subject).create(createAttributeDto, userReq);
  }

  @Get(':subject')
  @ApiParam({ name: 'subject', enum: AttrSubject })
  @ApiQuery({ name: 'isRequired', required: false })
  findAll(
    @Param('subject') subject: AttrSubject,
    @AuthUser() userReq: JwtUser,
    @Query('isRequired') isRequired?: boolean,
  ) {
    return this.getService(subject).findAll(userReq, { isRequired });
  }

  @ApiParam({ name: 'subject', enum: AttrSubject })
  @Get(':subject/:id')
  findOne(
    @Param('subject') subject: AttrSubject,
    @Param('id') id: string, @AuthUser() userReq: JwtUser) {
    return this.getService(subject).findOne(id, userReq);
  }

  @ApiParam({ name: 'subject', enum: AttrSubject })
  @Put(':subject/:id')
  update(
    @Param('subject') subject: AttrSubject,
    @Param('id') id: string, @Body() updateAttributeDto: UpdateAttributeDto,
    @AuthUser() userReq: JwtUser) {
    return this.getService(subject).update(id, updateAttributeDto, userReq);
  }

  @ApiParam({ name: 'subject', enum: AttrSubject })
  @Delete(':subject/:id')
  remove(
    @Param('subject') subject: AttrSubject,
    @Param('id') id: string, @AuthUser() userReq: JwtUser) {
    return this.getService(subject).remove(id, userReq);
  }
}
