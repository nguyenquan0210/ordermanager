import mongoose from "mongoose";
import { Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ORDER_COMMENT } from 'src/commons/constants/schemaConst';
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";
import { User } from "src/users/entities/user.entity";

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class OrderComment{

  @Prop()
  contentComment: string;

  @Prop()
  order?: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: User.name,
    autopopulate: { select: 'username fullName avatar' }
  })
  userId?: any;

  @Prop()
  userName?: string;

  @Prop([{
    type: mongoose.Schema.Types.ObjectId, ref: ORDER_COMMENT,
    autopopulate: { }
  }])
  replys?: string[]|OrderComment[];

  @Prop()
  idOrder?: string;
}

export type OrderCommentDocument = OrderComment & mongoose.Document;
export const OrderCommentSchema = SchemaFactory.createForClass(OrderComment);
var plugins = OrderCommentSchema.plugin(TenantPlugin.addPlugin);
OrderCommentSchema.index({ order: 1 });