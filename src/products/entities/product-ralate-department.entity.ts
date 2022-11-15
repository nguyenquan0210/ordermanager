import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Product } from "./product.entity";
import { Customer } from "src/customers/entities/customer.entity";
import { Department } from "src/departments/entities/department.entity";

const enum RelateType {
  Current = 'hientai',
  Relate = 'lienquan'
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ProductRelateDepartment {
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: Product.name,
  })
  product: string | Product;
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: Department.name,
  })
  department: string | Department;

  @Prop() 
  quantity: number;
  
  @Prop() 
  note?: string;

  @Prop({
    type: String, default: RelateType.Current,
    enum: [RelateType.Current, RelateType.Relate]
  })
  relateType: RelateType
}

export type ProductRelateDepartmentDoc = ProductRelateDepartment & mongoose.Document;

export const ProductRelateDepartmentSchema = SchemaFactory.createForClass(ProductRelateDepartment)