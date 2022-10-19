import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ORDER_HISTORY } from 'src/commons/constants/schemaConst';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { Sorting } from 'src/commons/dto/sorting';
import { filterParams } from 'src/commons/utils/filterParams';
import { OrderHistoryDocument } from '../entities/order-history.entity';
import { CreateHistoryDto } from './dto/create-history.dto';
import { QueryHistoryDto } from './dto/query-history.dto';

@Injectable()
export class HistoriesService {
  constructor(
    @InjectModel(ORDER_HISTORY) private model: Model<OrderHistoryDocument>,
  ) { }

  async getAll(authUser: JwtUser, query?: Paginate & QueryHistoryDto & Sorting) {
    const cond = filterParams(query, ['order', 'updatedBy']);

    const cmd = this.model.find(cond)
      .byTenant(authUser.owner)
      .lean({ autopopulate: false })
      .populate({
        path: 'order',        
        populate: { path: 'order', select: 'name description category status labels' }
      })
      .populate({
        path: 'updatedBy',        
        populate: { path: 'user', select: 'username fullName email avatar' }
      })
      .select('-before -after -change')

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

  create(dto: CreateHistoryDto, authUser: JwtUser) {
    return new this.model(dto)
      .withTenant(authUser.owner)
      .save();
  }

  delete(id: string) {
    return this.model.deleteMany({ order: id}).exec();
  }
}
