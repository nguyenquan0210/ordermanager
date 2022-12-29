import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { S3File, S3FileSchema } from 'src/storages/s3File.schema';
import { ITenant } from 'src/commons/mongoosePlugins/tenant';
import { Types } from 'mongoose';
import { ProductAttributeDocument, ProductAttributeSchema } from "./product-attribute.entity";
import { ProductCategory } from 'src/product-categories/entities/product-category.entity';
import { PRODUCT_COLOR, PRODUCT_CTG, PRODUCT_LABEL, PRODUCT_RELATE_COLOR, PRODUCT_RELATE_CUSTOMER, PRODUCT_RELATE_TODO, PRODUCT_STATUS } from 'src/commons/constants/schemaConst';
import { ProductStatus } from 'src/product-status/entities/product-status.entity';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { Label } from 'src/labels/entities/label.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { User } from 'src/users/entities/user.entity';
import { Todo } from 'src/todos/entities/todo.entity';
import { CommissionFeeTypeEnum } from 'src/commons/enum/products/commissionFeeTypeEnum';
import { PriceType } from 'src/commons/enum/products/priceTypeEnum';
import { ProductRelateColors } from './products-ralate-color.entity';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class Product implements ITenant {
    @Prop()
    name: string;

    @Prop()
    description?: string;

    @Prop([S3FileSchema])
    imageList?: Types.Array<S3File>;

    @Prop([S3FileSchema])
    videoList?: Types.Array<S3File>;

    @Prop([S3FileSchema])
    fileList?: Types.Array<S3File>;

    owner?: string;

    @Prop([ProductAttributeSchema])
    attributes?: Types.Array<ProductAttributeDocument>;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: PRODUCT_CTG,
        autopopulate: { select: 'name description' }
    })
    category?: string | ProductCategory;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: PRODUCT_STATUS,
        autopopulate: { select: 'name color description' }
    })
    status?: string | ProductStatus;

    @Prop([{
        type: mongoose.Schema.Types.ObjectId, ref: PRODUCT_LABEL,
        autopopulate: { select: 'name color description' }
    }])
    labels?: string[] | Label[];

    @Prop({ default: 0 }) 
    price: number;

    @Prop({ default: 0 }) 
    priceSale?: number;

    @Prop({ default: 0 }) 
    priceIn?: number;

    @Prop({ default: 0 }) 
    quantity: number;   

    @Prop({ default: 0 }) 
    totalQuantity: number;   

    @Prop() 
    unit?: string;

    // @Prop({ default: PriceType.NotarizedPrice }) 
    // priceType: PriceType;

    // @Prop({ default: 0 }) 
    // commissionFee?: number;

    // @Prop({ default: CommissionFeeTypeEnum.Owner }) 
    // commissionFeeType?: CommissionFeeTypeEnum;

    // @Prop() 
    // address?: string;

    // @Prop() 
    // code?: string;

    // @Prop({ default: 0 }) 
    // dientich?: number;

    // @Prop() 
    // information?: string;

    @Prop({ default: false }) 
    isHot?: boolean;

    @Prop() 
    note?: string;

    // @Prop() 
    // malo?: string;

    // @Prop() 
    // direction?: string;

    @Prop([{
        type: mongoose.Schema.Types.ObjectId, ref: User.name,
        autopopulate: { select: 'username fullName phone avatar birth' }
    }])
    relateStaffs?: Types.Array<User>;

    @Prop([{
        type: mongoose.Schema.Types.ObjectId, ref: Customer.name,
        autopopulate: { select: 'fullName email phone avatar' }
    }])

    @Prop() 
    productCode?: string;

    relateOwners?: Types.Array<Customer>;

    /** Virtual field */
    relateCustomers?: { customer: Customer }[];
    
    /** Virtual field */
    relateTodos?: { todo: Todo }[];

    /** Virtual field */
    relateColors?: { color: ProductRelateColors }[];
}

export type ProductDocument = Product & Document;
export const ProductSchema = SchemaFactory.createForClass(Product);
var plugins = ProductSchema.plugin(TenantPlugin.addPlugin);
ProductSchema.index({ name: 'text', description: 'text', information: 'text', malo: 'text', productCode:'text' })
    .index({ category: 1 })
    .index({ labels: 1 })

plugins.virtual('relateCustomers', {
    ref: PRODUCT_RELATE_CUSTOMER,
    justOne: false,
    localField: '_id',
    foreignField: 'product'
});

plugins.virtual('relateTodos', {
    ref: PRODUCT_RELATE_TODO,
    justOne: false,
    localField: '_id',
    foreignField: 'product'
});

plugins.virtual('relateColors', {
    ref: PRODUCT_RELATE_COLOR,
    justOne: false,
    localField: '_id',
    foreignField: 'product'
});

