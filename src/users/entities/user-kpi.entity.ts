import mongoose from "mongoose";
import { Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";
import { User } from "src/users/entities/user.entity";

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class UserKPI{

  @Prop()
  kpiOrder: number;

  @Prop()
  kpiTotalCustomer: number;

  @Prop()
  kpiTotalOrder: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: User.name,
    autopopulate: { select: 'username fullName avatar' }
  })
  userId?: string|any;

  @Prop()
  kpiDate?: Date;

}

export type UserKPIDocument = UserKPI & mongoose.Document;
export const UserKPISchema = SchemaFactory.createForClass(UserKPI);
var plugins = UserKPISchema.plugin(TenantPlugin.addPlugin);
UserKPISchema.index({ userId: 1 });

