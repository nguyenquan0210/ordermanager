import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { JwtUser } from 'src/auth/inteface/jwtUser';
import { CUSTOMER_RELATE_CUSTOMER } from 'src/commons/constants/schemaConst';
import { filterParams } from 'src/commons/utils/filterParams';
import { CreateCustomerRelateCustomerDto } from './dto/create-customer-relate-customer.dto';
import { UpdateCustomerRelateCustomerDto } from './dto/update-customer-relate-customer.dto';
import { CustomerRelateCustomer } from './entities/customer-relate-customer.entity';

@Injectable()
export class CustomerRelateCustomerService {
  constructor(
    @InjectModel(CUSTOMER_RELATE_CUSTOMER) private model: Model<CustomerRelateCustomer>
  ) { }

  create(createDto: CreateCustomerRelateCustomerDto, authUser: JwtUser) {
    return new this.model(createDto)
    .withTenant(authUser.owner)
    .save();
  }

  findAll(authUser: JwtUser, option?: { customer?: string }) {
    const cond = filterParams(option, ['customer']);

    const cmd = this.model.find(cond)
      .byTenant(authUser.owner);
    
    return cmd.exec();
  }

  findOne(id: string, authUser: JwtUser) {
    return this.model.findById(id)
      .byTenant(authUser.owner)
      .exec();
  }

  update(id: string, updateDto: UpdateCustomerRelateCustomerDto, authUser: JwtUser,
    options?: { upsert?: boolean; }
  ) {
    return this.model.findByIdAndUpdate(id, updateDto, { upsert: options.upsert ?? false })
      .byTenant(authUser.owner)
      .exec();
  }
  updateMany(query: FilterQuery<CustomerRelateCustomer>,
    updateDto: UpdateCustomerRelateCustomerDto,
    options: { upsert?: boolean; }
  ) {
    return this.model.updateMany(query, updateDto, { upsert: options.upsert ?? false })
      .exec();
  }

  remove(id: string, authUser: JwtUser) {
    return this.model.findByIdAndDelete(id)
      .byTenant(authUser.owner)
      .exec()
  }

  deleteMany(filter: FilterQuery<CustomerRelateCustomer>) {
    return this.model.deleteMany(filter).exec();
  }

}
