import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { CUSTOMER_DEMAND_GROUP } from 'src/commons/constants/schemaConst';
import { CreateCustomerDemandGroupsDto } from './dto/create-customer-demandGroup.dto';
import { CustomerDemandGroupsDocument } from '../entities/customer-demandGroup.entity';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { UpdateCustomerDemandGroupsDto } from './dto/update-customer-demandGroup.dto';
import { ErrCode } from 'src/commons/constants/errorConstants';

@Injectable()
export class CustomerDemandGroupsService {
  /**
   *
   */
  constructor(
    @InjectModel(CUSTOMER_DEMAND_GROUP) private customerDemandGroupsModel: Model<CustomerDemandGroupsDocument>
  ) { }

  create(createCustomerDemandGroupsDto: CreateCustomerDemandGroupsDto, authUser: JwtUser) {
    return new this.customerDemandGroupsModel(createCustomerDemandGroupsDto)
    .withTenant(authUser.owner)  
    .save();
  }

  async findAll(authUser: JwtUser, query?: Paginate) {
    var cmd = this.customerDemandGroupsModel.find()
          .byTenant(authUser.owner)
          .lean({ autopopulate: true })

    if (query.limit) {
      cmd.limit(query.limit);
    }
    if (query.offset) {
      cmd.skip(query.offset);
    }

    const totalCmd = this.customerDemandGroupsModel.countDocuments(cmd.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), cmd.exec()]);
    return { total, data };
  }

  findOne(id: string, authUser: JwtUser) {
    return this.customerDemandGroupsModel.findById(id)
        .byTenant(authUser.owner)
        .lean({ autopopulate: true })
        .orFail(new NotFoundException(ErrCode.E_CUSTOMER_DEMAND_GROUP_NOT_FOUND))
        .exec();
  }

  update(id: string, updateCustomerDemandGroupsDto: UpdateCustomerDemandGroupsDto, authUser: JwtUser) {
    return this.customerDemandGroupsModel.findByIdAndUpdate(id, updateCustomerDemandGroupsDto, { new: true })
      .byTenant(authUser.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_DEMAND_GROUP_NOT_FOUND))
      .exec();
  }

  async remove(id: string, userReq: JwtUser) {
    const demandGroup = await this.customerDemandGroupsModel.findByIdAndDelete(id)
      .byTenant(userReq.owner)
      .orFail(new NotFoundException(ErrCode.E_CUSTOMER_DEMAND_GROUP_NOT_FOUND))
      .exec();

      return demandGroup;
    }
  }
