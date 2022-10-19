import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, Types } from 'mongoose';
import { ITenant } from 'src/commons/mongoosePlugins/tenant';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { User } from 'src/users/entities/user.entity';
import { Customer } from './customer.entity';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class CustomerNote implements ITenant {

    @Prop()
    note?: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Customer.name })
    customer: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    createdBy?: string | User;
    owner?: string | User;
}

export type CustomerNoteDocument = CustomerNote & Document;
export const CustomerNoteSchema = SchemaFactory.createForClass(CustomerNote);
CustomerNoteSchema.plugin(TenantPlugin.addPlugin)
    .index({ customer: 1, createdAt: 1 })
