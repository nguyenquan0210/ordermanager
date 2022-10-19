import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { PRODUCT_STATUS } from 'src/commons/constants/schemaConst';
import { CreateProductStatusDto } from './dto/create-product-status.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ProductStatusDocument } from './entities/product-status.entity';
import { UserRole, StaffRole } from 'src/users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';

@Injectable()
export class ProductStatusService {
  constructor(
    @InjectModel(PRODUCT_STATUS) private statusModel: Model<ProductStatusDocument>,
  ) { }
  async create(createProductStatusDto: CreateProductStatusDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Profile);
    if(createProductStatusDto.color){
      const checkColor = await this.checkColor(createProductStatusDto.color, authUser);
      if (checkColor) {
          throw new BadRequestException(ErrCode.E_COLOR);
      }
    }
    return new this.statusModel(createProductStatusDto)
      .withTenant(authUser.owner)
      .save();
  }

  async checkColor(color: string, authUser: JwtUser){
    let check = await this.statusModel.findOne({color: color}).byTenant(authUser.owner).exec();
    if (check) {
        return true; 
    }
    return false;
  }

  async findAll(authUser: JwtUser) {
    const data = await this.statusModel.find()
      .byTenant(authUser.owner)
      .lean()
      .exec();
    return { data, total: data.length };
  }

  findOne(id: string, authUser: JwtUser) {
    return this.statusModel.findById(id)
      .byTenant(authUser.owner)
      .populateTenant('username')
      .lean()
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_STATUS_NOT_FOUND))
      .exec();
  }

  async update(id: string, updateProductStatusDto: UpdateProductStatusDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Profile);
    if(updateProductStatusDto.color){
      const status = await this.findOne(id, authUser);
      if(status && status.color != updateProductStatusDto.color){
          const checkColor = await this.checkColor(updateProductStatusDto.color, authUser);
          if (checkColor) {
              throw new BadRequestException(ErrCode.E_COLOR);
          }
      }
    }
    return this.statusModel.findByIdAndUpdate(id, updateProductStatusDto, { new: true })
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_STATUS_NOT_FOUND))
      .exec();
  }

  remove(id: string, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Profile);

    return this.statusModel.findByIdAndDelete(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_PRODUCT_STATUS_NOT_FOUND))
      .exec();
  }
}
