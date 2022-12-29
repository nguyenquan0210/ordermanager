import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { PRODUCT_COLOR } from "src/commons/constants/schemaConst";
import { Label } from "src/labels/entities/label.entity";
import { Department } from "./department.entity";
import { Product } from "src/products/entities/product.entity";

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class DepartmentDetailts {
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: Product.name,
    autopopulate: { select: 'name' }
  })
  product: string | Product;
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: PRODUCT_COLOR,
    autopopulate: { select: 'name' }
  })
  color: string | Label;

  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: Department.name,
  })
  department: string | Department;

  @Prop() 
  quantity: number;

  @Prop() 
  money: number;
  
  @Prop() 
  unit: string;
  
  @Prop({default: false}) 
  isDelete?: boolean;

}

export type DepartmentDetailtsDoc = DepartmentDetailts & mongoose.Document;

export const DepartmentDetailtsSchema = SchemaFactory.createForClass(DepartmentDetailts)