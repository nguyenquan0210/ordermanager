import mongoose, { Document } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Customer } from "../../entities/customer.entity";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class CustomerRelateCustomer {
    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: Customer.name,
    })
    customer: string;
    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: Customer.name,
        autopopulate: { select: 'fullName phone email gender' }
    })
    customer1: string;

    @Prop()
    relateName: string;
}

export type CustomerCustomerDocument = CustomerRelateCustomer & Document;

export const CustomerCustomerSchema = SchemaFactory.createForClass(CustomerRelateCustomer);
var plugins = CustomerCustomerSchema.plugin(TenantPlugin.addPlugin);

CustomerCustomerSchema.index({ customer: 1, customer1: 1 })
