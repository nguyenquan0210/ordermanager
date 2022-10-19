import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Product } from "src/products/entities/product.entity";
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class OrderProduct {
    @Prop()
    order?: string;

    @Prop()
    product: string;
    
    @Prop()
    nameProduct?: string;

    @Prop()
    imgProduct?: string;

    @Prop({required: true,  default: 1})
    quantity: number;

    @Prop()
    price?: number;

    @Prop()
    priceSale?: number;

    @Prop({default: false})
    isDone?: boolean;

    @Prop() 
    unit?: string;
}
export type OrderProductDocument = OrderProduct & mongoose.Document;
export const OrderProductSchema = SchemaFactory.createForClass(OrderProduct);
var plugins = OrderProductSchema.plugin(TenantPlugin.addPlugin);
OrderProductSchema.index({ order: 1 });