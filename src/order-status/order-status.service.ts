import { map } from 'lodash';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { ORDER_STATUS } from 'src/commons/constants/schemaConst';
import { CreateOrderStatusDto } from './dto/create-order-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatusDocument } from './entities/order-status.entity';
import { StaffRole } from 'src/users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';

@Injectable()
export class OrderStatusService {
  constructor(
    @InjectModel(ORDER_STATUS) private statusModel: Model<OrderStatusDocument>,
  ) { }
  async create(createOrderStatusDto: CreateOrderStatusDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Profile);
    if(createOrderStatusDto.color){
      const checkColor = await this.checkColor(createOrderStatusDto.color, authUser);
      if (checkColor) {
          throw new BadRequestException(ErrCode.E_COLOR);
      }
    }
    return new this.statusModel(createOrderStatusDto)
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
    return { total: data.length, data };
  }

  async getListId(authUser: JwtUser) {
    const data = await this.statusModel.find()
      .byTenant(authUser.owner)
      .lean()
      .exec();
    const list = data.map((item)=>{
      return item._id
    })
    return list;
  }

  findOne(id: string, authUser: JwtUser) {
    return this.statusModel.findById(id)
      .byTenant(authUser.owner)
      .populateTenant('username')
      .lean()
      .orFail(new NotFoundException(ErrCode.E_ORDER_STATUS_NOT_FOUND))
      .exec();
  }

  async update(id: string, updateOrderStatusDto: UpdateOrderStatusDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Profile);
    if(updateOrderStatusDto.color){
      const status = await this.findOne(id, authUser);
      if(status && status.color != updateOrderStatusDto.color){
          const checkColor = await this.checkColor(updateOrderStatusDto.color, authUser);
          if (checkColor) {
              throw new BadRequestException(ErrCode.E_COLOR);
          }
      }
    }
    return this.statusModel.findByIdAndUpdate(id, updateOrderStatusDto, { new: true })
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_ORDER_STATUS_NOT_FOUND))
      .exec();
  }

  remove(id: string, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Profile);

    return this.statusModel.findByIdAndDelete(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_ORDER_STATUS_NOT_FOUND))
      .exec();
  }
}
