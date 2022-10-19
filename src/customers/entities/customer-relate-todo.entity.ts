import { Todo } from './../../todos/entities/todo.entity';
import { RelateType } from './../interface/customer-relate';
import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Customer } from "src/customers/entities/customer.entity";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class CustomerRelateTodo {
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: Customer.name,
  })
  customer: string | Customer;
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: Todo.name,
  })
  todo: string | Todo;
  @Prop() note?: string;

  @Prop({
    type: String, default: RelateType.Current,
    enum: [RelateType.Current, RelateType.Relate]
  })
  relateType: RelateType

    /** Virtual field */
  object: { object: Todo };
}

export type CustomerRelateTodoDoc = CustomerRelateTodo & mongoose.Document;

export const CustomerRelateTodoSchema = SchemaFactory.createForClass(CustomerRelateTodo)

CustomerRelateTodoSchema.plugin(TenantPlugin.addPlugin)
.virtual('object', {
    ref: Todo.name,
    justOne: false,
    localField: 'todo',
    foreignField: '_id'
});