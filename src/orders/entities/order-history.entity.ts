import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Order } from "./order.entity";
import { User } from "src/users/entities/user.entity";
import { StatusHistory } from "src/commons/dto/status.dto";

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class OrderHistory {
  @Prop({
    types: mongoose.Schema.Types.ObjectId, ref: Order.name,
    autopopulate: { select: 'name' }
  })
  order: string;
  
  @Prop({ type: mongoose.Schema.Types.Mixed })
  before: object;
  
  @Prop({ type: mongoose.Schema.Types.Mixed })
  after: object;
  
  @Prop({ type: mongoose.Schema.Types.Mixed })
  change: object;
  
  @Prop()
  status: string | StatusHistory;

  @Prop({
    types: mongoose.Schema.Types.ObjectId, ref: User.name,
    autopopulate: { select: 'username fullName email avatar' }
  })
  updatedBy: string;
}

export type OrderHistoryDocument = OrderHistory & mongoose.Document;
export const OrderHistorySchema = SchemaFactory.createForClass(OrderHistory);
OrderHistorySchema.index({order: 1})
