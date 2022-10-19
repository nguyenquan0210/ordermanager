import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Product } from "./product.entity";
import { Customer } from "src/customers/entities/customer.entity";
import { Todo } from "src/todos/entities/todo.entity";

const enum RelateType {
  Current = 'hientai',
  Relate = 'lienquan'
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ProductRelateTodoCustomer {
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: Product.name,
  })
  product: string | Product;
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: Todo.name,
  })
  todo: string | Todo;
  
  @Prop() 
  note?: string;

  @Prop({
    type: String, default: RelateType.Current,
    enum: [RelateType.Current, RelateType.Relate]
  })
  relateType: RelateType
}

export type ProductRelateTodoCustomerDoc = ProductRelateTodoCustomer & mongoose.Document;

export const ProductRelateTodoCustomerSchema = SchemaFactory.createForClass(ProductRelateTodoCustomer)