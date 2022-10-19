import { Customer } from './customer.entity';
import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from 'src/users/entities/user.entity';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class CustomerHistory{
  @Prop({
    types: mongoose.Schema.Types.ObjectId, ref: Customer.name,
    autopopulate: { select: 'fullName avatar' }
  })
  customer: string;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  before: object;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  after: object;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  change?: object;

  @Prop({
    types: mongoose.Schema.Types.ObjectId, ref: User.name,
    autopopulate: { select: 'username fullName email avatar' }
  })
  updatedBy: string;
}

export type CustomerHistoryDocument = CustomerHistory & mongoose.Document;
export const CustomerHistorySchema = SchemaFactory.createForClass(CustomerHistory);
CustomerHistorySchema.index({ customer: 'text' })
.index({ product: 1 })
