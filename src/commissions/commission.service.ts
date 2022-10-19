import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import _ from 'lodash';
import { FilterQuery, Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { Sorting, SortOrder } from 'src/commons/dto/sorting';
import { Order, OrderDocument } from 'src/orders/entities/order.entity';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { StaffRole, TypeCommission, UserRole } from 'src/users/interface/userRoles';
import { CreateArrCommissionDto, CreateCommissionDto } from './dto/create-commission.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { Commission, CommissionDocument } from './entities/commission.entity';

@Injectable()
export class CommissionService {
  constructor(
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  create(createCommissionDto: CreateCommissionDto, authUser: JwtUser) {
    if (authUser.role == UserRole.Staff) {
      throw new ForbiddenException();
    }
    return new this.commissionModel(createCommissionDto)
      .withTenant(authUser.owner)
      .save()
  }

  async addArrCommission(createArrCommissionDto: CreateArrCommissionDto, authUser: JwtUser) {
    if (authUser.role == UserRole.Staff) {
      throw new ForbiddenException();
    }
    return await this.updateRelateStaff(createArrCommissionDto, authUser);
  }

  async createAsync(createArrCommissionDto: CreateArrCommissionDto, authUser: JwtUser) {
    let arrCommission = [];
    if (createArrCommissionDto) {
      createArrCommissionDto?.Commissions.forEach(async element => {
        const exists = arrCommission.find(x => x.totalMoney == element.totalMoney);
        if (!exists) {
          arrCommission.push(element);
          await new this.commissionModel(element).withTenant(authUser.owner).save();
        }
      });
    }
  }

  async updateRelateStaff(createArrCommissionDto: CreateArrCommissionDto, authUser: JwtUser) {
    if (createArrCommissionDto) {
      var result = this.commissionModel.deleteMany().byTenant(authUser.owner)
      if ((await result).ok == 1) {
        await this.createAsync(createArrCommissionDto, authUser);
      }
    }
  }

  async findAll(authUser: JwtUser, query?: Sorting) {
    const cmd = this.commissionModel.find()
      .byTenant(authUser.owner)
      .lean({ autopopulate: true });
    if (query.sortBy) {
      cmd.sort({ [query.sortBy]: query.sortOrder });
    }

    const totalCmd = this.commissionModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { total, data };
  }

  findOne(id: string, authUser: JwtUser) {
    return this.commissionModel.findById(id)
      .byTenant(authUser.owner)
      .lean({ autopopulate: true })
      .orFail(new NotFoundException(ErrCode.E_COMMISSION_NOT_FOUND))
      .exec();
  }

  update(id: string, updateCommissionDto: UpdateCommissionDto, authUser: JwtUser) {
    if (authUser.role == UserRole.Staff) {
      throw new ForbiddenException();
    }
    return this.commissionModel.findByIdAndUpdate(id, updateCommissionDto)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_COMMISSION_NOT_FOUND))
      .exec();
  }

  remove(id: string, authUser: JwtUser) { 
    if (authUser.role == UserRole.Staff) {
      throw new ForbiddenException();
    }
    return this.commissionModel.findByIdAndDelete(id)
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_COMMISSION_NOT_FOUND))
      .exec();
  }

  
  async findAllOrderCommissions(userReq: JwtUser, userId?: string, year?: Date) {

    if (!year) {
      year = new Date()
    }
    year = new Date(year)
    let totalMoney = 0, totalMoneyCommission = 0, total = 0, data = [], dataCommission = [], dateNow = new Date();
    let totalMoneyCommissionNow = 0, totalMoneyNow = 0, percentCommissionNow = 0;

    let users = await this.userModel.findById(userReq?.owner || userReq?.userId)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_USER_NOT_FOUND))
      .exec()
    for (let index = 1; index <= 12; index++) {
      const cmd = this.orderModel.find({
        $expr: {
          $and: [
            {
              "$eq": [{ "$month": "$dueDate" }, index]
            },
            {
              "$eq": [{ "$year": "$dueDate" }, year.getFullYear()]
            }
          ]
        }
      })
        .byTenant(userReq.owner)
        .lean({ autopopulate: true })
        .select("dueDate totalMoney")

      if (userReq.role == UserRole.Staff) {
        let checkStaffRole = false;
        for (let indexstaffRole = 0; indexstaffRole < userReq.staffRole?.length; indexstaffRole++) {
          if (userReq.staffRole && userReq.staffRole[indexstaffRole] == StaffRole.Accountant) {
            checkStaffRole = true;
          }
          if (userReq.staffRole && userReq.staffRole[indexstaffRole] == StaffRole.Account) {
            checkStaffRole = true;
          }
        }
        if (checkStaffRole != true) {
          cmd.where('createdBy', userReq.userId);
        }
      }
      if (userId) {
        cmd.where('createdBy', userId);
      }
      const totalCmd = this.orderModel.countDocuments(cmd.where('isDone', true).getQuery());
      const [dataMonth, totalMonth] = await Promise.all([cmd.where('isDone', true).exec(), totalCmd.exec()]);

      let totalMoneyMonthCommission = 0, totalMoneyMonth = 0;
      for (let indexdataMonth = 0; indexdataMonth < dataMonth?.length; indexdataMonth++) {
        totalMoneyMonth += dataMonth[indexdataMonth].totalMoney || 0;
      }
      const commissions = await this.commissionModel.find()
      .byTenant(userReq.owner)
      .lean({ autopopulate: true }).sort({ 'totalMoney': SortOrder.asc }).exec();
      if (commissions && commissions.length > 0)
        if (users?.commission == TypeCommission.Incremental) {
          let commission = commissions.filter(x => x.totalMoney >= totalMoneyMonth).shift();
          if (!commission) {
            commission = commissions.pop();
            console.log(true)
          }
          if (commission) {
            totalMoneyMonthCommission = (totalMoneyMonth * commission.percentCommission) / 100;
            if ((year.getFullYear() == dateNow.getFullYear() && (index - 1) == dateNow.getMonth()) || (year.getFullYear() != dateNow.getFullYear() && index == 1)) {
              percentCommissionNow = commission.percentCommission;
              totalMoneyCommissionNow = totalMoneyMonthCommission;
              totalMoneyNow = totalMoneyMonth;
            }
          }
        }

      if (users?.commission == TypeCommission.Reset) {
        let resetTotalMoney = totalMoneyMonth
        for (let indexcommission = 0; indexcommission < commissions?.length; indexcommission++) {
          let aboutcomissions = commissions[indexcommission].totalMoney - (commissions[indexcommission - 1]?.totalMoney || 0);
          let resetcommissions = 0;
          if (resetTotalMoney > commissions[indexcommission].totalMoney) {
            resetcommissions = aboutcomissions;
          } else {
            resetcommissions = resetTotalMoney;
          }
          if (indexcommission != commissions?.length - 1) {
            resetTotalMoney -= resetcommissions
          }
          let commission = (resetcommissions * commissions[indexcommission].percentCommission) / 100
          totalMoneyMonthCommission += commission;
          if ((year.getFullYear() == dateNow.getFullYear() && (index - 1) == dateNow.getMonth()) || (year.getFullYear() != dateNow.getFullYear() && index == 1)) {
            totalMoneyCommissionNow += commission;
            totalMoneyNow = totalMoneyMonth;
            dataCommission = [...dataCommission,
            { about: (indexcommission != commissions?.length - 1 ? ((commissions[indexcommission - 1]?.totalMoney || 0) != 0 ? '...' : 0) + '-' : '> ') + commissions[indexcommission].totalMoney, percentCommission: commissions[indexcommission].percentCommission, commission }
            ]
          } 

        }
      }

      data = [...data,
      { month: index, total: totalMonth, totalMoneyMonth, totalMoneyMonthCommission }
      ]
      total += totalMonth;
      totalMoney += totalMoneyMonth;
      totalMoneyCommission += totalMoneyMonthCommission;
    }
    let percentCommission = 0
    if (users?.commission == TypeCommission.Incremental) {
      if (totalMoney > 0) {
        percentCommission = (totalMoneyCommission * 100) / totalMoney;
      }

    }

    return {
      total, totalMoney, totalMoneyCommission,percentCommission: new Number(percentCommission.toFixed(2)),
      totalMoneyNow, totalMoneyCommissionNow, percentCommissionNow, dataCommission, data
    };
  }

}
