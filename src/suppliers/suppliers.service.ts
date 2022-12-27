import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery } from 'mongoose';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { ErrCode } from 'src/commons/constants/errorConstants';
import { Paginate } from 'src/commons/dto/paginate.dto';
import { Sorting } from 'src/commons/dto/sorting';
import { Status } from 'src/commons/enum/status.enum';
import { StaffRole } from 'src/users/interface/userRoles';
import { CheckRoleStaff } from 'src/utils/checkRoleStaff';
import { CreateSuppliersDto } from './dto/create-suppliers.dto';
import { UpdateSuppliersDto } from './dto/update-suppliers.dto';
import { Suppliers, SuppliersDocument } from './entities/suppliers.entity';

@Injectable()
export class SuppliersService {
  /**
   *
   */
  constructor(
    @InjectModel(Suppliers.name) private suppliersModel: Model<SuppliersDocument>,
  ) { }
  create(createSuppliersDto: CreateSuppliersDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Product)
    return new this.suppliersModel(createSuppliersDto)
      .save();
  }

  async findAll(authUser: JwtUser, query?: Paginate & Sorting & { search?: string, status?: Status,}) {
    const filter: FilterQuery<SuppliersDocument> = {};
    if (query.search) {
      filter.$text = { $search: query.search };
    }
    const cmd = this.suppliersModel.find(filter)
      .lean({ autopopulate: true })
    if (query.status) {
      cmd.where('status', query.status)
    }
    if (query.limit) {
      cmd.limit(query.limit)
    }
    if (query.offset) {
      cmd.skip(query.offset)
    }
    if (query.sortBy) {
      cmd.sort({ [query.sortBy]: query.sortOrder })
    }

    const totalCmd = this.suppliersModel.countDocuments(cmd.getQuery());
    const [data, total] = await Promise.all([cmd.exec(), totalCmd.exec()]);

    return { data, total };
  }

  findOne(id: string, authUser: JwtUser) {
    return this.suppliersModel.findById(id)
      .orFail(new NotFoundException(ErrCode.E_SUPPLIER_NOT_FOUND))
      .lean({ autopopulate: true })
      .exec();
  }

  update(id: string, updateSuppliersDto: UpdateSuppliersDto, authUser: JwtUser) {
    CheckRoleStaff(authUser, StaffRole.Product)
    return this.suppliersModel.findByIdAndUpdate(id, updateSuppliersDto, { new: true })
      .orFail(new NotFoundException(ErrCode.E_SUPPLIER_NOT_FOUND))
      .exec()
  }

  async remove(id: string, authUser: JwtUser) {
    const doc = await this.suppliersModel.findByIdAndDelete(id)
      .orFail(new NotFoundException(ErrCode.E_SUPPLIER_NOT_FOUND))
      .exec()
      return doc;
  }
}
