import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Product } from "./product.entity";
import { Customer } from "src/customers/entities/customer.entity";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';

const enum RelateType {
  Current = 'hientai',
  Relate = 'lienquan'
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ProductRelateCustomer {
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: Product.name,
  })
  product: string | Product;

  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: Customer.name,
  })
  customer: string | Customer;

  @Prop()
  note?: string;

  @Prop({
    type: String, default: RelateType.Current,
    enum: [RelateType.Current, RelateType.Relate]
  })
  relateType: RelateType

  /** Virtual field */
  object: { object: Product };
}

export type ProductRelateCustomerDoc = ProductRelateCustomer & mongoose.Document;

export const ProductRelateCustomerSchema = SchemaFactory.createForClass(ProductRelateCustomer)

ProductRelateCustomerSchema.plugin(TenantPlugin.addPlugin)
  .index({ customer: 1 })
  .virtual('object', {
    ref: Product.name,
    justOne: false,
    localField: 'product',
    foreignField: '_id'
  });