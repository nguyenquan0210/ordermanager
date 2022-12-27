import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
// import Excel from 'exceljs';
import path from "path";
import { ErrCode } from '../commons/constants/errorConstants';
import { UserChangePassword } from './dto/userChangePass.dto';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { UserRole, StaffRole, AllStaffRole, LevelAccount } from './interface/userRoles';
import { ChangeRoleDto, ChangeStaffRoleDto, ChangeLockDto, ChangeLevelAccountDto } from './dto/change-role.dto';
import { UserAttribute } from './entities/userAttribute.entity';
import { AttrSubject } from 'src/attributes/interface/attrSubject';
import { UserAttributeDto } from './dto/update-attr.dto';
import { QueryUser } from './dto/query-user.dto';
import { AttributesDynamicService } from 'src/attributes/attribute-dynamic.service';
import { deleteFile, signedUrl, uploadFile } from 'src/commons/utils/s3Client';
import { nanoid } from 'nanoid';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { VerifyStatus } from 'src/commons/define';
import { filterParams } from 'src/commons/utils/filterParams';
import { CheckRoleStaff, CheckRoleStaffCreateUser } from 'src/utils/checkRoleStaff';
import { CHECK_SIZE_FILE, LEVEL_ACCOUNT } from 'src/commons/constants/envConstanst';
import { MailService } from 'src/mail/mail.service';
import { MyLogService } from 'src/loggers/winston.logger';
import { USER_KPI } from 'src/commons/constants/schemaConst';
import { UserKPIDocument } from './entities/user-kpi.entity';
import { UpdateUserCurrencyUnitDto } from './dto/update-user-currency-unit.dto';
import { ChangeLanguageDto } from './dto/change-language.dto';
import { ResourcesService } from 'src/resources/resources.service';
import { ResourceType } from 'src/resources/inteface/resourceType';
import { ChangeCommissionDto } from './dto/change-commission.dto';
import { StaticFile } from 'src/commons/utils/staticFile';
//import { PackkagesService } from 'src/packkages/packkage.service';


@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(USER_KPI) private modelUserKPI: Model<UserKPIDocument>,
    // @Inject(AttrSubject.User) private attributeService: AttributesDynamicService,
    private mailService?: MailService,
    private logger?: MyLogService,
    private readonly resourcesService?: ResourcesService,
    //private readonly packkagesService?: PackkagesService,
    ) { }

  async create(createUserDto: CreateUserDto, userReq: JwtUser) {

    // const totalStaff = await this.checkTotalStaff(userReq);
    // if (totalStaff) {
    //   throw new BadRequestException(ErrCode.E_USER_MAX);
    // }
    if (userReq.role == UserRole.Staff) {
      CheckRoleStaff(userReq, StaffRole.Account);
    }

    if (createUserDto.staffCode) {
      const staffCode = await this.isStaffCodeExist(createUserDto.staffCode, userReq);
      if (staffCode) {
        throw new BadRequestException(ErrCode.E_STAFF_CODE_EXISTED);
      }
    }

    const username = await this.isUserExist(createUserDto.email);
    if (username) {
      throw new BadRequestException(ErrCode.E_USER_EXISTED);
    }

    const phoneNumber = await this.isPhoneNumberExist(createUserDto.phone);
    if (phoneNumber) {
      throw new BadRequestException(ErrCode.E_USER_PHONE_EXISTED);
    }
    // TODO: tempo uncheck atributes of user
    // if (!(userReq?.role == UserRole.Admin
    //   && (createUserDto.role == UserRole.Owner || createUserDto.role == UserRole.Admin))) {
    //   // check all required attributes
    //   const requiredAttrs = await this.attributeService.findAllRequired(userReq);
    //   for (let i = 0; i < requiredAttrs.length; i++) {
    //     const attr = requiredAttrs[i];
    //     const dataAttribute = createUserDto.attributes?.find(data => data.attribute == attr._id);
    //     if (!dataAttribute) {
    //       throw new BadRequestException({
    //         error: "Bad Request",
    //         message: ErrCode.E_ATTRIBUTE_REQUIRED,
    //         detail: `${attr.name} is required`
    //       })
    //     }
    //   }

    //   if (createUserDto.attributes) {
    //     for await (const attr of createUserDto.attributes) {
    //       await this.validateAttributes(attr);
    //     }
    //   }
    // }
    let user = new this.userModel(createUserDto);
    const hashPassword = await bcrypt.hash(user.password, 10);
    user.username = createUserDto.email;
    user.password = hashPassword;
    user.createdBy = userReq == null ? "" : userReq.username;

    if (userReq) {
      if (userReq.role == UserRole.Owner) {
        user.owner = userReq.owner;
        // user.manager = userReq.userId;
      } else if (userReq.role == UserRole.Manager) {
        user.owner = userReq.owner;
        user.manager = createUserDto.manager || userReq.userId;
      } else if (userReq.role == UserRole.Staff) {
        user.owner = userReq.owner;
        // user.manager = createUserDto.manager||userReq.manager
        // user.createdBy = userReq.username
      } else if (userReq.role == UserRole.Admin) {
        // admin create new owner
        if (user.role == UserRole.Owner) {
          user.owner = userReq.owner;
        } else if (user.role == UserRole.Manager || user.role == UserRole.Staff) {
          // admin create manager or staff -> must select manager
          let checkrole = CheckRoleStaffCreateUser(createUserDto, StaffRole.Account);
          if (checkrole) {
            user.owner = userReq.owner;
          } else {
            if (!user.manager) {
              throw new BadRequestException('MissingManager')
            }
            const manager = await this.findOne(user.manager, { throwIfFail: true });
            // set owner of new user to owner of the selected manager
            if (manager.role == UserRole.Owner) {
              user.owner = userReq.owner;
            } else {
              user.owner = userReq.owner;
            }
          }
        }
        if (user.role != UserRole.Admin
          && user.role != UserRole.Owner
          && !user.owner) {
          throw new BadRequestException('MissingOwner')
        }
      }
    }
    
    if (user.role == UserRole.Staff) {
      this.mailService.sendInfoStaff(user, createUserDto.password)
        .then((res) => {
          this.logger.log(`[email] send info to ${user.email} done: ${JSON.stringify(res)}`);
        })
        .catch(error => {
          this.logger.error(`[email] send info to ${user.email} error`, error.stack);
        })
    }
    return user.save();
  }

  async isStaffCodeExist(staffCode: string, userReq: JwtUser) {
    let staff = await this.userModel.findOne({ staffCode: staffCode }).byTenant(userReq.owner).exec();
    if (staff) {
      return true;
    }
    return false;
  }

  async registerStaff(createUserDto: CreateUserDto) {
    const user = new this.userModel(createUserDto);
    const hashPassword = await bcrypt.hash(user.password, 10);
    user.username = createUserDto.email;
    user.password = hashPassword;

    // find default owner
    const owner = await this.userModel.findOne({ role: UserRole.Owner })
      .exec();

    if (owner) {
      user.owner = owner._id;
    }

    return user.save();
  }

  async registerManager(createUserDto: CreateUserDto) {
    const user = new this.userModel(createUserDto);
    const hashPassword = await bcrypt.hash(user.password, 10);
    user.username = createUserDto.email;
    user.password = hashPassword;

    // find default owner
    const owner = await this.userModel.findOne({ role: UserRole.Owner })
      .exec();

    if (owner) {
      user.owner = owner._id;
    }

    return user.save();
  }

  async registerOwner(createUserDto: CreateUserDto) {
    const user = new this.userModel(createUserDto);
    const hashPassword = await bcrypt.hash(user.password, 10);
    user.username = createUserDto.email;
    user.password = hashPassword;

    // auto verify
    // user.verify = VerifyStatus.Verified 

    user.owner = user._id;
    user.levelAccount = LevelAccount.FREE

    return user.save();
  }

  async checkTotalStaff(userReq: JwtUser) {
    const { total } = await this.findAll(userReq, {});
    //let packkage = await this.packkagesService.findLevelAccount(userReq.levelAccount || LevelAccount.FREE);
    //let checkSize = (packkage?.staffNumber || LEVEL_ACCOUNT[userReq.levelAccount || LevelAccount.FREE].STAFF);
    return total > LEVEL_ACCOUNT[userReq.levelAccount || LevelAccount.FREE].STAFF;
  }

  async findAll(authUser: JwtUser, query: Paginate & QueryUser) {
    // CheckRoleStaff(authUser, StaffRole.Account);

    const cond = filterParams(query, ['createdBy']);
    const cmd = this.userModel.find(cond)
      .populate({
        path: 'owner',
        select: 'username fullName'
      })
    // .populate("manager");

    if (query.search) {
      cmd.find({ $text: { $search: query.search } });
    }
    if (authUser && authUser.role != UserRole.Admin) {
      const conditions: {}[] = [
        { _id: authUser.userId },
      ];
      if (authUser.role == UserRole.Owner) {
        conditions.push({ owner: authUser.userId })
      } else if (authUser.owner) {
        conditions.push(
          { _id: authUser.owner },
          { owner: authUser.owner },
        );
      }
      cmd.or(conditions);
    }
    if (authUser.role == UserRole.Admin) {
      if (query.levelAccount) {
        if (query.levelAccount != LevelAccount.FREE) {
          cmd.where('levelAccount', query.levelAccount);
        }
        cmd.where('levelAccount').in([query.levelAccount, null, '']);
      }
    }
    if (query.roles && query.roles.length) {
      cmd.where('role').in(query.roles);
    }

    if (query.limit) {
      cmd.limit(query.limit);
    }
    if (query.offset) {
      cmd.skip(query.offset);
    }
    const resultCmd = cmd.select('-attributes -tokenFirebase')
      .lean()
    const totalCmd = this.userModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([resultCmd.exec(), totalCmd.exec()]);

    if (authUser.role == UserRole.Admin) {
      let result = []
      for (let index = 0; index < data?.length; index++) {
        const cmd = this.userModel.find()
          .where('owner', data[index]._id)
          .lean();
        const totalStaff = await this.userModel.countDocuments(cmd.getQuery()).exec();
        result = [...result, {
          ...data[index],
          'totalStaff': totalStaff
        }]
      }
      return { total, data: result };
    }

    return { total, data: data };
  }

  findOne(id: string, options?: { throwIfFail?: boolean, password?: boolean, lean?: boolean }) {
    const cmd = this.userModel.findById(id)
    if (options?.lean) {
      cmd.lean({ autopopulate: true })
    }
    if (options?.password) {
      cmd.select("+password")
    }
    if (options?.throwIfFail)
      cmd.orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))

    return cmd.exec()
  }

  findOneUser(id: string, options?: { throwIfFail?: boolean, password?: boolean, lean?: boolean }, authUser?: JwtUser) {
    const cmd = this.userModel.findById(id)
    
    if (options?.lean) {
      cmd.lean({ autopopulate: true })
    }
    if (options?.password) {
      cmd.select("+password")
    }
    if(authUser.role != UserRole.Admin)
      cmd.byTenant(authUser?.owner)
    if (options?.throwIfFail)
      cmd.orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))

    return cmd.exec()
  }

  async getMe(id: string, authUser: JwtUser) {
    const doc = await this.userModel.findById(id)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .lean()
      .exec();

    if (authUser.role != UserRole.Owner) {
      const owner = await this.userModel.findById(authUser.owner)
        .lean()
        .exec();
      if (owner.currencyUnit) {
        doc.currencyUnit = owner.currencyUnit;
      } else {
        doc.currencyUnit = '';
      }
    }

    return doc;
  }

  async findCurrencyUnit(authUser: JwtUser) {
    const doc = await this.userModel.findById(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec()
    if (!doc.currencyUnit) {
      throw new BadRequestException('No Currency Unit');
    }
    return { currencyUnit: doc.currencyUnit }
  }

  findManagers(authUser: JwtUser) {
    const cmd = this.userModel.find()
      .byTenant(authUser.owner)
      .where('role').in([UserRole.Manager]);
    const result = cmd.exec();
    return result;
  }


  async getSizeFileOwner(authUser: JwtUser) {
    const doc = await this.userModel.findById(authUser.owner).exec();
    const sizeFile = doc?.sizeFile ? doc.sizeFile : 0
    return sizeFile;
  }

  getStaffRole(authUser: JwtUser) {
    const result = AllStaffRole;
    return result;
  }

  async findByUsername(username: string, { password }: { password: boolean }) {
    let cmd = this.userModel.findOne({ username });
    if (password) {
      cmd.select('+password')
    }
    return cmd.exec();
  }

  async isPhoneNumberExist(phone: string) {
    let user = await this.userModel.findOne({ phone: phone }).exec();
    if (user) {
      return true;
    }
    return false;
  }

  async isUserExist(username: string) {
    let user = await this.userModel.findOne({ username: username }).exec();
    if (user) {
      return true;
    }
    return false;
  }

  async update(id: string, updateUserDto: UpdateUserDto, userReq?: JwtUser) {

    if (id !== userReq.userId) {
      CheckRoleStaff(userReq, StaffRole.Account);
    }

    // if (updateUserDto.attributes) {
    //   if (!(userReq.role == UserRole.Admin)) {
    //     // check all required attributes
    //     const requiredAttrs = await this.attributeService.findAllRequired(userReq);
    //     for (let i = 0; i < requiredAttrs.length; i++) {
    //       const attr = requiredAttrs[i];
    //       const dataAttribute = updateUserDto.attributes?.find(data => data.attribute == attr._id);
    //       if (!dataAttribute) {
    //         throw new BadRequestException({
    //           error: "Bad Request",
    //           message: ErrCode.E_ATTRIBUTE_REQUIRED,
    //           detail: `${attr.name} is required`
    //         })
    //       }
    //     }
    //   }

    //   for await (const attr of updateUserDto.attributes) {
    //     await this.validateAttributes(attr);
    //   }
    // }

    let user = this.userModel.findById(id);
    if(userReq?.role != UserRole.Admin){
      user.orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
    }
    const userC = await user.exec();
    if (userC && updateUserDto.staffCode && updateUserDto.staffCode != userC?.staffCode) {
      const staffCode = await this.isStaffCodeExist(updateUserDto.staffCode, userReq);
      if (staffCode) {
        throw new BadRequestException(ErrCode.E_STAFF_CODE_EXISTED);
      }
    }

    if (userC && updateUserDto.phone && updateUserDto.phone != userC?.phone) {
      const phoneNumber = await this.isPhoneNumberExist(updateUserDto.phone);
      if (phoneNumber) {
        throw new BadRequestException(ErrCode.E_USER_PHONE_EXISTED);
      }
    }

    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true })
    .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND)).exec();
  }

  async updateCurrencyUnit(updateUserCurrencyUnitDto: UpdateUserCurrencyUnitDto, userReq: JwtUser) {
    if (userReq.role != UserRole.Owner) {
      throw new ForbiddenException()
    }
    const cmd = this.userModel.findByIdAndUpdate(userReq.userId, updateUserCurrencyUnitDto)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
    return cmd.exec();
  }

  async changeLanguage(id: string, info: ChangeLanguageDto) {
    const user = await this.userModel.findById(id)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec();
    user.defaultLanguage = info.defaultLanguage;
    return user.save();
  }

  async changeCommission(id: string, info: ChangeCommissionDto, authUser: JwtUser) {
    const user = await this.userModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec();
    user.commission = info.commission;
    return user.save();
  }

  async remove(id: string, userReq: JwtUser) {

    // CheckRoleStaff(userReq, StaffRole.Account);
    if (userReq.role == UserRole.Staff) {
      throw new ForbiddenException()
    }

    const doc = await this.userModel.findByIdAndDelete(id)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec();

    // if (doc.avatar) {
    //   const res = await deleteFile(doc.avatar);
    // }
    this.delete(id);
    return doc;
  }

  async verifyUserPassword(user: UserDocument, password: string) {
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );
    return validPassword;
  }

  async verifyUserEmail(username: string) {
    const user = await this.userModel.findOne({ username: username }).exec();
    if (user) {
      if (user.verify == VerifyStatus.Pending) {
        return false;
      }
    }

    return true;
  }

  async changePassword(id: string, info: UserChangePassword) {
    const user = await this.userModel.findById(id)
      .select('+password')
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec();
    const checkPass = await this.verifyUserPassword(user, info.currentPassword);
    if (!checkPass) {
      throw new BadRequestException(ErrCode.E_USER_PASS_NOT_MATCH);
    }
    const hashPassword = await bcrypt.hash(info.newPassword, 10);
    user.password = hashPassword;

    await user.save();
    return true;
  }

  async setPassword(user: UserDocument, password: string) {
    const hashPassword = await bcrypt.hash(password, 10);
    user.password = hashPassword;
    return user;
  }

  async changeAvatar(id: string, file: Express.Multer.File, authUser: JwtUser) {
   
    const user = await this.userModel.findById(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec();

      const url = `users/avatars/${id}/${file.filename}`;
      if (user.avatar) {
          const filename = StaticFile.getFileName(user.avatar);
          // delete file server
          const url = StaticFile.getLocalFileUpload('users', filename);
          StaticFile.deleteStaticFile(url);
      }
    user.avatar = url;
    return await user.save();
  }

  async getAvatarSignedUrl(id: string, fileName: string, authUser?: JwtUser) {
    const key = StaticFile.getLocalFileUpload('users', fileName);
    return key;
  }

  async changeRole(info: ChangeRoleDto, authUser: JwtUser) {
    const user = await this.userModel.findById(info.userId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec();

    if (this.compareRole(authUser.role, info.role) <= 0) {
      throw new ForbiddenException(ErrCode.E_NEED_HIGHER_ROLE);
    }

    user.role = info.role;
    return user.save();
  }

  async changeStaffRole(info: ChangeStaffRoleDto, authUser: JwtUser) {
    if (authUser?.levelAccount != LevelAccount.BASIC && authUser?.levelAccount != LevelAccount.ADVANCE) {
      throw new ForbiddenException(ErrCode.E_NEED_HIGHER_LEVEL_ACCOUNT);
    }
    const user = await this.userModel.findById(info.userId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec();

    if (this.compareRole(authUser.role, user.role) <= 0) {
      throw new ForbiddenException(ErrCode.E_NEED_HIGHER_ROLE);
    }

    user.staffRole = info.staffRole || [];
    return user.save();
  }

  async changeLevelAccount(info: ChangeLevelAccountDto, authUser: JwtUser) {
    if (authUser.role != UserRole.Admin) {
      throw new ForbiddenException();
    }
    const user = await this.userModel.findById(info.userId)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec();
    if (user && user.role != UserRole.Owner) {
      throw new BadRequestException(ErrCode.E_USER_NOT_OWNER)
    }
    user.levelAccount = info.levelAccount;
    return user.save();
  }

  async changeStaffLock(info: ChangeLockDto, authUser: JwtUser) {
    const user = await this.userModel.findById(info.userId)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec();

    user.lock = info.lock || false;
    return user.save();
  }

  async setUserVerified(id: string) {
    return await this.userModel.findByIdAndUpdate(id,
      {
        verify: VerifyStatus.Verified
      },
      { new: true }
    );
  }
  private roleLevel = {
    'admin': 0,
    'owner': -1,
    'manager': -2,
    'staff': -3,
  }

  /** 
   * Return 1 if A > B, 0 if A == B, Otherwise return -1
   */
  private compareRole(roleA: UserRole, roleB: UserRole) {
    const val = this.roleLevel[roleA] - this.roleLevel[roleB];
    return val > 0 ? 1 : (val < 0 ? -1 : 0);
  }
  //#region Attributes
  // private async validateAttributes(attr: UserAttribute) {
  //   return this.attributeService.validateAttribute(attr);
  // }

  // async updateAttribute(userId: string, attrDto: UserAttributeDto, authUser: JwtUser) {
  //   await this.validateAttributes(attrDto);

  //   const cmd = this.userModel.findById(userId)
  //     .byTenant(authUser.owner)
  //     .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
  //   const user = await cmd
  //     .exec();

  //   if (!user) {
  //     throw new NotFoundException(ErrCode.E_USER_NOT_FOUND);
  //   }
  //   const userAttribute = user.attributes.find(attr => attr.attribute['_id'] == attrDto.attribute);
  //   if (userAttribute) {
  //     userAttribute.set(attrDto);
  //   } else {
  //     user.attributes.push({ attribute: attrDto.attribute, value: attrDto.value });
  //   }

  //   return await user.save();
  // }

  // async deleteAttribute(userId: string, attrId: string, authUser: JwtUser) {
  //   const requiredAttrs = await this.attributeService.findAllRequired(authUser);
  //   const isRequired = requiredAttrs.find(attr => attr._id.equals(attrId));
  //   if (isRequired) {
  //     throw new BadRequestException({
  //       error: "Bad Request",
  //       message: ErrCode.E_ATTRIBUTE_REQUIRED,
  //       detail: `${isRequired.name} is required`
  //     })
  //   }

  //   const user = await this.userModel.findById(userId)
  //     .byTenant(authUser.owner)
  //     .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
  //     .exec();
  //   const idx = user.attributes.findIndex(a => a.attribute['_id'] == attrId);
  //   if (idx > -1) {
  //     user.attributes.splice(idx, 1);
  //   }
  //   return await user.save();
  // }
  //#endregion

  async checkStaffCode(userReq: JwtUser, staffCode: string) {
    const check = await this.isStaffCodeExist(staffCode, userReq);
    if (check) {
      throw new BadRequestException(ErrCode.E_STAFF_CODE_EXISTED);
    }
    return true;
  }

  async findAllToken(authUser: JwtUser) {
    const cmd = this.userModel.find().byTenant(authUser.owner)
    const resultCmd = cmd.select('tokenFirebase').lean()
    const totalCmd = this.userModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([resultCmd.exec(), totalCmd.exec()]);
    let token = [];
    for (let i = 0; i < total; i++) {
      if (data[i].tokenFirebase && data[i].tokenFirebase?.length > 0) {
        token = [...token, ...data[i].tokenFirebase]
      }
    }
    return token;
  }

  async findToken(id: string) {
    const cmd = await this.userModel.findById(id)
      .lean({ autopopulate: true })
      .select("tokenFirebase")
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec()
    let token = [];
    if (cmd.tokenFirebase && cmd.tokenFirebase?.length > 0) {
      token = [...cmd.tokenFirebase]
    }
    return token
  }

  async updateDeviceTokens(token: string, authUser: JwtUser) {
    const user = await this.userModel.findById(authUser.userId)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec();

    user.tokenFirebase.addToSet(token)

    return user.save();
  }

  async removeDeviceToken(token: string, authUser: JwtUser) {
    const user = await this.userModel.findByIdAndUpdate(authUser.userId,
      {
        $pullAll: { tokenFirebase: [token] }
      })
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec();

    return user;
  }

  updateManyUserTokens(tokens: string[], authUser: JwtUser) {
    if (tokens && tokens?.length > 0) {
      for (let index = 0; index < tokens.length; index++) {
        this.userModel.updateMany(
          { tokenFirebase: { $in: [tokens[index]] } },
          { $pullAll: { tokenFirebase: [tokens[index]] } }
        )
          .byTenant(authUser.owner)
          .exec();
      }
    }
    return true;
  }
  async getAvatar(id: string) {
    const cmd = await this.userModel.findById(id)
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec()
    let img = '';
    if (cmd.avatar) {
      img = await signedUrl(cmd.avatar);
    }
    return img;
  }

  delete(id: string) {
    return this.modelUserKPI.deleteMany({ userId: id }).exec();
  }

  async getLevelAccount(idOwner: string, check?: Boolean) {
    const cmd = this.userModel.findById(idOwner)
      .select('+levelAccount')
    if (check) {
      cmd.orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
    }
    const user = await cmd.exec()
    if (check) {
      if (user && user.role != UserRole.Owner) {
        throw new BadRequestException(ErrCode.E_USER_NOT_OWNER)
      }
    }
    return user.levelAccount;
  }

  async getCommission(idOwner: string, check?: Boolean) {
    const cmd = this.userModel.findById(idOwner)
    if (check) {
      cmd.orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
    }
    const user = await cmd.exec()
    
    return user?.commission;
  }

  // statistic the number of users this month compared to the previous month
  async countUserMonth(userReq: JwtUser, date?: Date) {
    if (!date) {
      date = new Date()
    }
    let amplitude = false;
    let total = 0, percent = 0, tg = 0;
    let data = [];

    for (let index = 1; index <= 2; index++) {

      let dateDay = new Date(date.getFullYear(), (date.getMonth() + 1), 0);
      const day = dateDay.getDate();
      let dayWeek = date.getDay();
      let dataWeek = [];
      let totalWeek = 0, week = 0;

      for (let indexDay = 1; indexDay <= day; indexDay++) {
        const cmdWeek = this.userModel.find({
          $expr: {
            $and: [
              {
                "$eq": [{ "$dayOfMonth": "$createdAt" }, indexDay]
              },
              {
                "$eq": [{ "$month": "$createdAt" }, (date.getMonth() + 1)]
              },
              {
                "$eq": [{ "$year": "$createdAt" }, date.getFullYear()]
              }
            ]
          }
        })
          .lean({ autopopulate: true })
          .where('role', UserRole.Owner)
          .select("createdAt")

        const totalCmdWeek = await this.userModel.countDocuments(cmdWeek.getQuery()).exec();

        totalWeek += totalCmdWeek;
        dayWeek += 1;
        if (dayWeek == 7 || indexDay == day) {
          week += 1;
          dataWeek = [...dataWeek,
          { week: week, total: totalWeek }
          ]
          dayWeek = 0;
          totalWeek = 0;
        }
      }
      const cmd = this.userModel.find({
        $expr: {
          $and: [
            {
              "$eq": [{ "$month": "$createdAt" }, (date.getMonth() + 1)]
            },
            {
              "$eq": [{ "$year": "$createdAt" }, date.getFullYear()]
            }
          ]
        }
      })
        .lean({ autopopulate: true })
        .where('role', UserRole.Owner)
        .select("createdAt")

      const totalCmd = await this.userModel.countDocuments(cmd.getQuery()).exec();
      data = [...data,
      { month: (date.getMonth() + 1), year: date.getFullYear(), total: totalCmd, data: dataWeek }
      ]
      if (tg >= totalCmd) {
        amplitude = true;
        percent = ((tg - totalCmd) * 100) / (totalCmd == 0 ? 1 : totalCmd);
      } else {
        percent = ((totalCmd - tg) * 100) / (totalCmd == 0 ? 1 : totalCmd);
        amplitude = false;
      }
      tg = totalCmd
      total += totalCmd;
      date.setMonth(date.getMonth() - 1)
    }

    return { total, year: `${new Date().getFullYear()}`, amplitude, percent: new Number(percent.toFixed(2)), data };
  }

  // user statistics by month
  async findAllUserMonth(userReq: JwtUser, date?: Date) {
    if (!date) {
      date = new Date()
    }
    let dateDay = new Date(date.getFullYear(), (date.getMonth() + 1), 0);
    const day = dateDay.getDate()

    let totalMoney = 0;
    let total = 0;
    let data = [];
    for (let index = 1; index <= day; index++) {
      const cmd = this.userModel.find({
        $expr: {
          $and: [
            {
              "$eq": [{ "$dayOfMonth": "$createdAt" }, index]
            },
            {
              "$eq": [{ "$month": "$createdAt" }, (date.getMonth() + 1)]
            },
            {
              "$eq": [{ "$year": "$createdAt" }, date.getFullYear()]
            }
          ]
        }
      })
        .lean({ autopopulate: true })
        .where('role', UserRole.Owner)
        .select("createdAt")

      const totalCmd = await this.userModel.countDocuments(cmd.getQuery()).exec();
      data = [...data,
      { day: index, total: totalCmd }
      ]
      total += totalCmd;
    }

    return { total, month: `${(date.getMonth() + 1)}/${date.getFullYear()}`, data };
  }

  //user statistics by year
  async findAllUserYear(userReq: JwtUser, year?: Date) {
    if (!year) {
      year = new Date()
    }
    year = new Date(year)
    let totalMoney = 0;
    let total = 0;
    let data = [];
    for (let index = 1; index <= 12; index++) {
      const cmd = this.userModel.find({
        $expr: {
          $and: [
            {
              "$eq": [{ "$month": "$createdAt" }, index]
            },
            {
              "$eq": [{ "$year": "$createdAt" }, year.getFullYear()]
            }
          ]
        }
      })
        .lean({ autopopulate: true })
        .where('role', UserRole.Owner)
        .select("createdAt")


      const totalCmd = await this.userModel.countDocuments(cmd.getQuery()).exec();
      data = [...data,
      { month: index, total: totalCmd }
      ]
      total += totalCmd;
    }

    // const workbook = new Excel.Workbook();
    // const worksheet = workbook.addWorksheet('Countries List');
    
    // worksheet.columns = [
    //   { key: 'year', header: 'Năm' },
    //   { key: 'totalyear', header: 'Tổng khách hàng trong năm' },
    //   { key: 'month', header: 'Tháng' },
    //   { key: 'total', header: 'Tổng khách hàng trong tháng' },
    // ];
    // worksheet.addRow({totalyear:total,year: year.getFullYear()});
    // data.forEach((item) => {
    //   worksheet.addRow(item);
    // });
    
    // const exportPath = path.resolve(__dirname, 'data.xlsx');

    // await workbook.xlsx.writeFile(exportPath);
    return { total, year: year.getFullYear(), data };
  }

  // async testExcelToJson(file: Express.Multer.File,) {
  //   const workbook = new Excel.Workbook();
  //   const exportPath = path.resolve(__dirname, 'data.xlsx');
  //   console.log(exportPath)

  //   await workbook.xlsx.readFile(exportPath);
  //   //const workbookReader = new Excel.stream.xlsx.WorkbookReader(exportPath);
  //   let jsonData = [];
  //   workbook.worksheets.forEach(function(sheet) {
  //       // read first row as data keys
  //       let firstRow = sheet.getRow(16);
  //       let d = 2;
  //       // while(firstRow.values){
  //       //   firstRow = sheet.getRow(d)
  //       //   d++;
  //       //   console.log(firstRow.values)
  //       //   console.log(d)
  //       // }
  //        console.log(firstRow.cellCount)
  //        console.log(firstRow.values)
  //       if (!firstRow.cellCount) return;
  //       let keys = firstRow.values;
  //       sheet.eachRow((row, rowNumber) => {
  //           if (rowNumber == 1) return;
  //           let values = row.values
  //           //console.log(rowNumber,values)
  //           let obj = {};
  //           for (let i = 1; i < keys.length; i ++) {
  //             //console.log(i,values[i])
  //               if(values[i] != undefined)
  //                 obj[keys[i]] = values[i];
  //           }
  //           //console.log(obj)
  //           if(obj?.['undefined'] !=0 && (typeof obj?.['Tổng khách hàng trong năm']) == typeof 1){
  //             //console.log(obj?.['Tổng khách hàng trong năm'])
  //             jsonData.push(obj);
  //           }
  //       })

  //   });
  //   console.log(jsonData);
  //  // console.log(workbookReader)
  //   return jsonData // worksheet
  // }
 
}
