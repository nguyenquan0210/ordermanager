import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export class OrderSurcharge {
    @Prop()
    nameSurcharge: string;

    @Prop()
    priceSurcharge: number;

}
export type OrderSurchargeDocument = OrderSurcharge & mongoose.Document;
export const OrderSurchargeSchema = SchemaFactory.createForClass(OrderSurcharge);