import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ITenant } from "src/commons/mongoosePlugins/tenant";
import { User } from "src/users/entities/user.entity";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class OrderStatus implements ITenant {
    @Prop() name: string;
    @Prop() description?: string;
    @Prop() color?: string;
    @Prop({ default: false })
    inactiveOrder: boolean;

    owner?: User | string;
}

export type OrderStatusDocument = OrderStatus & Document;

export const OrderStatusSchema = SchemaFactory.createForClass(OrderStatus);

OrderStatusSchema.plugin(TenantPlugin.addPlugin);
