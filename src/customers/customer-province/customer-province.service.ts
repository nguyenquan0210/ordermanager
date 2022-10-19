import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { PROVINCE } from 'src/commons/constants/schemaConst';
import { filterParams } from 'src/commons/utils/filterParams';
import { CustomerProvince } from './entities/customer-province.entity';
import { Sorting } from 'src/commons/dto/sorting';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { QueryProvince } from './dto/query-province.dto';
import { CustomerProvinceDocument } from './entities/customer-province.entity';

@Injectable()
export class CustomerProvinceService {
  constructor(
    @InjectModel(PROVINCE) private model: Model<CustomerProvinceDocument>
  ) { }

  async findAll(authUser: JwtUser, query?: Paginate & QueryProvince & Sorting) {

    const filter: FilterQuery<CustomerProvinceDocument> = {};
    if (query.search) {
      filter.$text = { $search: `.*${query.search}.*`, $language: "en" } ;
    }

    const cmd = this.model.find({ ...filter })
    .lean();

    if (query.code) {
      cmd.where('code', Number(query.code));
    }
    if (query.limit) {
      cmd.limit(query.limit);
    }
    if (query.offset) {
      cmd.skip(query.offset);
    }
    if (query.sortBy) {
      cmd.sort({ [query.sortBy]: query.sortOrder })
    }

    const totalCmd = this.model.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { total, data };
  }
  
  async findAllProvince(authUser: JwtUser, query?: QueryProvince ) {
    const filter: FilterQuery<CustomerProvinceDocument> = {};
    if (query.search) {
      filter.$text = { $search: `.*${query.search}.*`, $language: "en" } ;
    }
    const cmd = this.model.find({ ...filter })
    .select('-districts')
    .lean();

    if (query.code) {
      cmd.where('code', Number(query.code));
    }
    const totalCmd = this.model.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { total, data };
  }

  findOne(id: string, authUser: JwtUser) {
    return this.model.findById(id)
      .exec();
  }

  async findAllDistricts(id: string, authUser: JwtUser) {
    
    const cmd = await this.model.findById(id)
      .lean()
      .exec();


    return { data: cmd.districts };
  }

}
