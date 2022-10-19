import { CustomerHistoryDocument } from './../entities/customer-history.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { CUSTOMER_HISTORY } from 'src/commons/constants/schemaConst';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { filterParams } from 'src/commons/utils/filterParams';
import { CustomerQueryHistoryDto } from './dto/customer-query-history.dto';
import { CreateCustomerHistoryDto } from './dto/customer-history.dto';
import { Sorting } from 'src/commons/dto/sorting';
import { FilterQuery } from 'mongoose';

@Injectable()
export class CustomerHistoriesService {
  constructor(
    @InjectModel(CUSTOMER_HISTORY) private model: Model<CustomerHistoryDocument>,
  ) { }

  async getAll(authUser: JwtUser, query?: Paginate & CustomerQueryHistoryDto & Sorting) {
    const filter: FilterQuery<CustomerHistoryDocument> = {};
    
    if (query.search) {
      filter.$text = { $search: query.search };
    }   
    if (query.toDate) {
      filter.createdAt = { $gte: query.toDate };
    }
    if (query.fromDate) {
      filter.createdAt = { ...filter.createdAt, $lte: query.fromDate };
    }
 
    const cmd = this.model.find(filter)
      .byTenant(authUser.owner)
      .lean({ autopopulate: false })
      .populate({
        path: 'customer',        
        populate: { path: 'customer', select: 'fullName email phone avatar' }
      })
      .populate({
        path: 'updatedBy',        
        populate: { path: 'user', select: 'username fullName email avatar' }
      })
      .select('-before -after')

    if (query.limit) {
      cmd.limit(query.limit)
    }
    if (query.offset) {
      cmd.skip(query.offset)
    }
    if (query.sortBy) {
      cmd.sort({ [query.sortBy]: query.sortOrder })
    }
    
    const totalCmd = this.model.countDocuments(cmd.getQuery());
    const [total, data] = await Promise.all([totalCmd.exec(), cmd.exec()]);
    return { total, data };
  }

  /** get detail of an update */
  getId(id: string, authUser: JwtUser) {
    return this.model.findById(id)
      .byTenant(authUser.owner)
      .lean({ autopopulate: true })
      .exec();
  }

  create(dto: CreateCustomerHistoryDto, authUser: JwtUser) {
    return new this.model(dto)
      .withTenant(authUser.owner)
      .save();
  }

  delete(id: string) {
    return this.model.deleteMany({ customer: id}).exec();
  }
}
