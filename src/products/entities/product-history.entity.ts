import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Product } from "./product.entity";
import { User } from "src/users/entities/user.entity";
import { StatusHistory } from "src/commons/dto/status.dto";

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ProductHistory {
  @Prop({
    types: mongoose.Schema.Types.ObjectId, ref: Product.name,
    autopopulate: { select: 'name' }
  })
  product: string;
  
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

export type ProductHistoryDocument = ProductHistory & mongoose.Document;
export const ProductHistorySchema = SchemaFactory.createForClass(ProductHistory);
ProductHistorySchema.index({product: 1})
