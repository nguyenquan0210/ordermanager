import {
  Controller, Get, Post, Body, Param, Delete, Put,
  UseInterceptors, UploadedFile, DefaultValuePipe, ParseIntPipe, Res, Req,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BearerJwt } from 'src/decors/bearer-jwt.decorator';
import { ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserChangePassword } from './dto/userChangePass.dto';
import { OkRespone } from 'src/commons/OkResponse';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerFileFilter, } from 'src/configs/multer.cnf';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { AuthUser } from 'src/decors/user.decorator';
import { Roles } from 'src/decors/roles.decorator';
import { LevelAccount, UserRole } from './interface/userRoles';
import { ChangeRoleDto, ChangeStaffRoleDto, ChangeLockDto, ChangeLevelAccountDto } from './dto/change-role.dto';
import { UserAttributeDto } from './dto/update-attr.dto';
import { Query } from '@nestjs/common';
import { FileUploadDto } from 'src/commons/dto/file-upload.dto';
import { AllowPublic } from 'src/decors/allow-public.decorator';
import { UpdateDeviceTokenDto } from './dto/update-deviceToken.dto';
import { UpdateUserCurrencyUnitDto } from './dto/update-user-currency-unit.dto';
import { ChangeLanguageDto } from './dto/change-language.dto';
import { ChangeCommissionDto } from './dto/change-commission.dto';

@Controller('users')
@BearerJwt()
@ApiTags('User')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto, @AuthUser() authUser: JwtUser) {
    const res = await this.usersService.create(createUserDto, authUser);
    return new OkRespone({ data: { _id: res._id } });
  }

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  // @ApiQuery({ name: 'manager', required: false, type: String, description: 'Id of manager user' })
  @ApiQuery({ name: 'createdBy', required: false, type: String, description: 'Username who create user' })
  @ApiQuery({ name: 'roles', required: false, enum: UserRole, isArray: true })
  @ApiQuery({ name: 'levelAccount', required: false, enum: LevelAccount })
  findAll(@AuthUser() user: JwtUser,
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe('0'), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe('0'), ParseIntPipe) offset?: number,
    @Query('search') search?: string,
    // @Query('manager') manager?: string,
    @Query('createdBy') createdBy?: string,
    @Query('levelAccount') levelAccount?: LevelAccount,
  ) {
    const { roles } = req.query;
    let roleArray; //string[]
    if (typeof roles === 'string') {
      roleArray = [roles];
    } else {
      roleArray = roles;
    }
    return this.usersService.findAll(user, {
      limit, offset, search,
      roles: roleArray,
      // manager,
      createdBy,
      levelAccount
    });
  }

  @Get('me')
  async getMe(@AuthUser() user: JwtUser) {
    const userId = user['userId'];
    return this.usersService.getMe(userId, user);
  }

  @Get('currency-unit')
  async getCurrencyUnit(@AuthUser() user: JwtUser) {
    return this.usersService.findCurrencyUnit(user);
  }

  @Get('level-account')
  async getLevel(@AuthUser() user: JwtUser) {
    const result = await this.usersService.getLevelAccount(user.owner, true);
    return new OkRespone({ data: { levelAccount: result } });
  }

  @ApiQuery({ name: 'staffCode', required: true, type: String })
  @Get('checkStaffCode')
  async checkStaffCode(@AuthUser() user: JwtUser, @Query('staffCode') staffCode?: string,) {
    return this.usersService.checkStaffCode(user, staffCode);
  }

  // @Get('userManagers')
  // getUseManager(@AuthUser() user: JwtUser) {
  //   return this.usersService.findManagers(user);
  // }

  @Get('staffRole')
  getStaffRole(@AuthUser() user: JwtUser) {
    return this.usersService.getStaffRole(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id, { throwIfFail: true, lean: true });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto,
    @AuthUser() userReq: JwtUser) {
    return this.usersService.update(id, updateUserDto, userReq);
  }

  @Post('deviceToken')
  async addDeviceToken(@Body() info: UpdateDeviceTokenDto,
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.usersService.updateDeviceTokens(info.tokenFirebase, authUser);
    return new OkRespone();
  }

  @Delete('deviceToken')
  async removeDeviceToken(@Body() info: UpdateDeviceTokenDto,
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.usersService.removeDeviceToken(info.tokenFirebase, authUser);
    return new OkRespone();
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @AuthUser() userReq: JwtUser) {
    const result = await this.usersService.remove(id, userReq);
    return new OkRespone();
  }

  @Post(':id/password')
  async changePassword(@Param('id') id: string, @Body() info: UserChangePassword) {
    const result = await this.usersService.changePassword(id, info);
    return new OkRespone();
  }

  @Post(':id/language')
  async changeLanguage(@Param('id') id: string, @Body() info: ChangeLanguageDto) {
    const result = await this.usersService.changeLanguage(id, info);
    return new OkRespone();
  }

  @Post(':id/commission')
  async changeCommission(@Param('id') id: string, @Body() info: ChangeCommissionDto, @AuthUser() userReq: JwtUser) {
    const result = await this.usersService.changeCommission(id, info, userReq);
    return new OkRespone();
  }
  /**
   * Upload avatar
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file. Support png, jpg, webp',
    type: FileUploadDto,
  })
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: multerFileFilter(['png', 'jpg', 'jpeg', 'webp']),
  }))
  async uploadAvatar(@Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @AuthUser() authUser: JwtUser
  ) {
    const result = await this.usersService.changeAvatar(id, file, authUser);
    return new OkRespone({ data: { _id: result._id, avatar: result.avatar } });
  }

  @ApiExcludeEndpoint()
  @Get('avatars/:id/:filename')
  @AllowPublic()
  async getAvatar(@Res() res: Response,
    @Param('id') owner: string,
    @Param('filename') filename: string,
    @AuthUser() authUser: JwtUser
  ) {
    const url = await this.usersService.getAvatarSignedUrl(owner, filename, authUser);
    return res.redirect(url);
  }

  @Post('role')
  @Roles(UserRole.Admin, UserRole.Owner)
  async changeRole(@Body() info: ChangeRoleDto, @AuthUser() authUser: JwtUser) {
    const result = await this.usersService.changeRole(info, authUser);
    return new OkRespone({ data: { _id: result._id, role: result.role } });
  }

  @Post('staffRole')
  @Roles(UserRole.Admin, UserRole.Owner, UserRole.Manager)
  async changeStaffRole(@Body() info: ChangeStaffRoleDto, @AuthUser() authUser: JwtUser) {
    const result = await this.usersService.changeStaffRole(info, authUser);
    return new OkRespone({ data: { _id: result._id, staffRole: result.staffRole } });
  }

  @Post('levelAccount')
  @Roles(UserRole.Admin)
  async changeLevelAccount(@Body() info: ChangeLevelAccountDto, @AuthUser() authUser: JwtUser) {
    const result = await this.usersService.changeLevelAccount(info, authUser);
    return new OkRespone({ data: { _id: result._id, levelAccount: result.levelAccount } });
  }

  @Post('staffLock')
  @Roles(UserRole.Admin, UserRole.Owner, UserRole.Manager)
  async changeStaffLock(@Body() info: ChangeLockDto, @AuthUser() authUser: JwtUser) {
    const result = await this.usersService.changeStaffLock(info, authUser);
    return new OkRespone({ data: { _id: result._id, lock: result.lock } });
  }

  @Post('currency-unit')
  @Roles(UserRole.Admin, UserRole.Owner, UserRole.Manager)
  updateCurrencyUnit(@Body() updateUserCurrencyUnitDto: UpdateUserCurrencyUnitDto, @AuthUser() authUser: JwtUser) {
    return this.usersService.updateCurrencyUnit(updateUserCurrencyUnitDto, authUser);
  }

  //#region Attributes
  /**
   * Add/Update an attribute for user
   */
  // @ApiParam({ name: 'id', description: 'Id of user' })
  // @Put(':id/attribute')
  // async addOrUpdateAttribute(
  //   @Param('id') id: string,
  //   @Body() info: UserAttributeDto,
  //   @AuthUser() userReq: JwtUser) {
  //   const result = await this.usersService.updateAttribute(id, info, userReq);
  //   return new OkRespone({ data: result });
  // }

  /**
   * Remove an optional attribute from user info.
   */
  // @ApiParam({ name: 'id', description: 'Id of user' })
  // @ApiParam({ name: 'attrId', description: 'Id of attribute' })
  // @Delete(':id/attribute/:attrId')
  // async deleteAttribute(@Param('id') id: string,
  //   @Param('attrId') attrId: string,
  //   @AuthUser() authUser: JwtUser) {
  //   const result = await this.usersService.deleteAttribute(id, attrId, authUser);
  //   return new OkRespone({ data: result });
  // }
  //#endregion

}
