import { RelateType } from './../interface/customer-relate';
import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Customer } from "src/customers/entities/customer.entity";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { User } from 'src/users/entities/user.entity';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class CustomerRelateStaff {
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: Customer.name,
  })
  customer: string | Customer;
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: User.name,
  })
  staff: string | User;

  @Prop() note?: string;

  @Prop({
    type: String, default: RelateType.Current,
    enum: [RelateType.Current, RelateType.Relate]
  })
  relateType: RelateType

  /** Virtual field */
  object: { object: User }[];
}

export type CustomerRelateStaffDoc = CustomerRelateStaff & mongoose.Document;

export const CustomerRelateStaffSchema = SchemaFactory.createForClass(CustomerRelateStaff)

CustomerRelateStaffSchema.plugin(TenantPlugin.addPlugin)
  .index({ customer: 1 })
  .virtual('object', {
    ref: User.name,
    justOne: false,
    localField: 'staff',
    foreignField: '_id'
  });
