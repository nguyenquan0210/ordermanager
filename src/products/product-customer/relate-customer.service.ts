import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PRODUCT_RELATE_CUSTOMER } from 'src/commons/constants/schemaConst';
import { CustomerDocument } from 'src/customers/entities/customer.entity';
import { ProductRelateCustomerDoc } from '../entities/product-relate-customer.entity';
import { ProductDocument } from '../entities/product.entity';
import { CreateProductRelateCustomerDto } from './dto/create-product-rel-customer.dto';

@Injectable()
export class RelateCustomerService {
  constructor(
    @InjectModel(PRODUCT_RELATE_CUSTOMER) private model: Model<ProductRelateCustomerDoc>
  ) { }

  async create(dto: CreateProductRelateCustomerDto) {
    const exists = await this.model.findOne(dto).lean().exec();
    if (exists) {
      return exists;
    }
    return new this.model(dto)
      .save()
  }

  async findAll(query: { product?: string, customer?: string }) {
    const docs = await this.model.find(query)
      .lean()
      .exec();
    return docs;
  }

  async delete(ids: string[]) {
    return await this.model.deleteMany({ _id: { $in: ids } })
      .exec();
  }

  remove(productId: string, customerId: string) {
    return this.model.findOneAndDelete({ product: productId, customer: customerId })
      .exec();
  }

  //#region relate Product in customer
  async addCustomerRelateProduct(doc: CustomerDocument, productIds: string[]) {
    if (productIds) {
      productIds.forEach(async element => {
        var dto = new CreateProductRelateCustomerDto();
        dto.customer = doc._id;
        dto.product = element;

        const exists = await this.model.findOne(dto).lean().exec();
        if (!exists) {
          await new this.model(dto).save();
        }
      });
    }
  }

  async updateRelateProduct(doc: CustomerDocument, productIds: string[]) {
    if (productIds) {
      var result = this.model.deleteMany({ customer: { $in: doc.id } })
      if ((await result).ok == 1) {
        this.addCustomerRelateProduct(doc, productIds);
      }
    }
  }

  removeMultiple(customerId: string, productIds: string[]) {
    return this.model.deleteMany({ customer: customerId, product: { $in: productIds } })
      .exec();
  }
  //#endregion

  //#region Relate Customer in product
  async addRelateCustomer(doc: ProductDocument, customerIds: string[]) {
    if (customerIds) {
      customerIds.forEach(async element => {
        var dto = new CreateProductRelateCustomerDto();
        dto.customer = element;
        dto.product = doc._id;

        const exists = await this.model.findOne(dto).lean().exec();
        if (!exists) {
          await new this.model(dto).save();
        }
      });
    }
  }
  
  async updateRelateCustomer(doc: ProductDocument, customerIds: string[]) {
    if(customerIds){
        var result = this.model.deleteMany({ product: { $in: doc.id } })
        if ((await result).ok == 1) {
          this.addRelateCustomer(doc, customerIds);
      }
    }
  }

  removeRelateCustomerMultiple(productId: string, customerIds: string[]) {
    return this.model.deleteMany({ product: productId, customer: { $in: customerIds } })
      .exec();
  }
  //#endregion
}
