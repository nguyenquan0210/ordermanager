import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { async } from 'rxjs';
import { CUSTOMER_RELATE_STAFF } from 'src/commons/constants/schemaConst';
import { CustomerRelateStaff } from '../entities/customer-relate-staff.entity';
import { CustomerDocument } from '../entities/customer.entity';
import { CreateCustomerRelateStaffDto } from './dto/create-customer-rel-staff.dto';

@Injectable()
export class CustomerRelateStaffService {
  constructor(
    @InjectModel(CUSTOMER_RELATE_STAFF) private model: Model<CustomerRelateStaff>
  ) { }

  async create(dto: CreateCustomerRelateStaffDto) {
    const exists = await this.model.findOne(dto).lean().exec();
    if (exists) {
      return exists;
    }
    return new this.model(dto)
      .save();
  }

  async createAsync(doc: CustomerDocument, idStaffId: string[]) {
    if (idStaffId) {
      idStaffId.forEach(async element => {
        var dto = new CreateCustomerRelateStaffDto();
        dto.customer = doc._id;
        dto.staff = element;

        const exists = await this.model.findOne(dto).lean().exec();
        if (!exists) {
          await new this.model(dto).save();
        }
      });
    }
  }

  async updateRelateStaff(doc: CustomerDocument, idStaffId: string[]) {
    if (idStaffId) {
      var result = this.model.deleteMany({ customer: { $in: doc.id } })
      if ((await result).ok == 1) {
        this.createAsync(doc, idStaffId);
      }
    }
  }

  async delete(ids: string[]) {
    return await this.model.deleteMany({ _id: { $in: ids } })
      .exec();
  }

  remove(customerId: string, staffIds: string[]) {
    return this.model.deleteMany({ customer: customerId, staff: { $in: staffIds } })
      .exec();
  }

  async findAll(query: { customer?: string, staff?: string }) {
    return this.model.find(query)
      .lean()
      .exec();
  }
}
