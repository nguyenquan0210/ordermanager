import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Label } from "src/labels/entities/label.entity";
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";
import { Types } from "mongoose";
import { TODO_DEMAND_STATUS, TODO_DEMAND_LABEL } from "src/commons/constants/schemaConst";
import { Customer } from "src/customers/entities/customer.entity";
import { Todo } from "./todo.entity";
import { Product } from "src/products/entities/product.entity";
import { DemandTarget } from "../interface/demand-target";

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class TodoDemand {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  startTime: Date;

  @Prop()
  endTime?: Date;

  @Prop({
    type: String, default: DemandTarget.Customer,
    enum: [
      DemandTarget.Customer, DemandTarget.Product,
    ]
  })
  target: string

  @Prop([{
    type: mongoose.Schema.Types.ObjectId, ref: TODO_DEMAND_LABEL,
    autopopulate: { select: 'name color description' }
  }])
  labels?: string[] | Label[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: TODO_DEMAND_STATUS,
    autopopulate: { select: 'name description color' }
  })
  status?: Label;

  @Prop({ default: 0 })
  relate: number;

  @Prop([{ type: mongoose.Schema.Types.ObjectId }])
  customers: Types.Array<Customer>;

  @Prop([{ type: mongoose.Schema.Types.ObjectId }])
  relateTodos: Types.Array<Todo>;

  @Prop([{ type: mongoose.Schema.Types.ObjectId }])
  products: Types.Array<Product>;

  @Prop()
  createdBy?: string;

  @Prop({default: false}) 
  isDone: boolean;
}

export type TodoDemandDocument = TodoDemand & mongoose.Document;
export const TodoDemandSchema = SchemaFactory.createForClass(TodoDemand);
var plugins = TodoDemandSchema.plugin(TenantPlugin.addPlugin);
TodoDemandSchema.index({ name: 'text', description: 'text' });
