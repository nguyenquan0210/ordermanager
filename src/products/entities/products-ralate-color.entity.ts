import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Product } from "./product.entity";
import { PRODUCT_COLOR } from "src/commons/constants/schemaConst";
import { Label } from "src/labels/entities/label.entity";

const enum RelateType {
  Current = 'hientai',
  Relate = 'lienquan'
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ProductRelateColors {
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: Product.name,
  })
  product: string | Product;
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: PRODUCT_COLOR,
  })
  color: string | Label;

  @Prop() 
  quantity: number;

  @Prop() 
  money: number;

  @Prop() 
  departmentMoney: number;
  
  @Prop() 
  note?: string;

}

export type ProductRelateColorsDoc = ProductRelateColors & mongoose.Document;

export const ProductRelateColorsSchema = SchemaFactory.createForClass(ProductRelateColors)