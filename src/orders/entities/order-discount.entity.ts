import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { StyleDiscount } from "../interface/order-discount";

export class OrderDiscount {
    @Prop({
        type: String, default: StyleDiscount.money,
        enum: [
            StyleDiscount.money, StyleDiscount.percent,
        ]
    })
    styleDiscount: string;

    @Prop()
    moneyDiscount: number;

}
export type OrderDiscountDocument = OrderDiscount & mongoose.Document;
export const OrderDiscountSchema = SchemaFactory.createForClass(OrderDiscount);