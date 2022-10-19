import { CUSTOMER_NOTE, PRODUCT_RELATE_CUSTOMER, TODO_DEMAND, CUSTOMER_RELATE_CUSTOMER } from './../../commons/constants/schemaConst';
import { Product } from 'src/products/entities/product.entity';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { Todo } from './../../todos/entities/todo.entity';
import mongoose from 'mongoose';
import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from 'src/users/entities/user.entity';
import { ITenant } from 'src/commons/mongoosePlugins/tenant';
import { Types } from 'mongoose';
import { CustomerAttributeDocument, CustomerAttributeSchema } from './customer-attribute.entity';
import { CUSTOMER_LABEL, CUSTOMER_RELATE_TODO, CUSTOMER_RELATE_STAFF } from 'src/commons/constants/schemaConst';
import { Label } from 'src/labels/entities/label.entity';
import { Gender } from "src/commons/define";
import { S3File, S3FileSchema } from 'src/storages/s3File.schema';
import { TodoDemand } from 'src/todos/entities/todo-demand.entity';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class Customer implements ITenant {
    @Prop()
    fullName: string;

    @Prop()
    phone?: string;

    @Prop({ lowercase: true })
    email?: string;

    @Prop()
    birth?: Date;

    @Prop({ default: Gender.Other })
    gender: Gender;

    @Prop()
    zaloUrl?: string;

    @Prop()
    facebookUrl?: string;

    @Prop()
    country?: string;

    @Prop()
    addressCity?: string;

    @Prop()
    addressDistrict?: string;

    @Prop()
    avatar?: string;

    @Prop()
    address?: string;

    @Prop()
    note?: string;

    // @Prop([S3FileSchema])
    // imageList: Types.Array<S3File>;

    @Prop([{
        type: mongoose.Schema.Types.ObjectId, ref: TODO_DEMAND,
        select: 'name description startTime endTime status relate'
    }])
    demands?: Types.Array<TodoDemand>;

    @Prop()
    relateCustomer?: string;

    @Prop({
        type: String, ref: User.name,
        autopopulate: { select: 'username' }
    })
    owner?: string;

    @Prop([CustomerAttributeSchema])
    attributes: Types.Array<CustomerAttributeDocument>;

    @Prop([{
        type: mongoose.Schema.Types.ObjectId, ref: CUSTOMER_LABEL,
        autopopulate: { select: 'name color description' }
    }])
    labels: string[] | Label[];

    @Prop()
    nhucauMinGia: number;

    @Prop()
    nhucauMaxGia: number;

    @Prop()
    carerStaffs: string[];

    @Prop()
    createdBy?: string;

    /** Virtual field */
    relateStaffs: { staff: User }[];

    /** Virtual field */
    relateProducts: { product: Product }[];

    /** Virtual field */
    relateTodos: { todo: Todo }[];

    @Prop()
    urlSocialNetwork?: string[];
}

export type CustomerDocument = Customer & Document;
export const CustomerSchema = SchemaFactory.createForClass(Customer);
const plugins = CustomerSchema.plugin(TenantPlugin.addPlugin)
    .index({ fullName: 'text' })
    .index({ phone: 1 })

plugins.virtual('relateProducts', {
    ref: PRODUCT_RELATE_CUSTOMER,
    justOne: false,
    localField: '_id',
    foreignField: 'customer'
});

plugins.virtual('relateTodos', {
    ref: CUSTOMER_RELATE_TODO,
    justOne: false,
    localField: '_id',
    foreignField: 'customer'
});

plugins.virtual('relateStaffs', {
    ref: CUSTOMER_RELATE_STAFF,
    justOne: false,
    localField: '_id',
    foreignField: 'customer'
});

plugins.virtual('notes', {
    ref: CUSTOMER_NOTE,
    justOne: false,
    localField: '_id',
    foreignField: 'customer',
})
plugins.virtual('relateCustomers', {
    ref: CUSTOMER_RELATE_CUSTOMER,
    justOne: false,
    localField: '_id',
    foreignField: 'customer',
})
