import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ITenant } from 'src/commons/mongoosePlugins/tenant';
import { Types } from 'mongoose';
import { ORDER_LABEL, ORDER_STATUS, ORDER_COMMENT, ORDER_PRODUCT } from 'src/commons/constants/schemaConst';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { Label } from 'src/labels/entities/label.entity';
import { User } from 'src/users/entities/user.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { OrderProduct } from "./order-product.entity";
import { OrderComment } from './order-comment.entity';
import { OrderSurchargeDocument, OrderSurchargeSchema } from "./order-surcharge.entity";
import { OrderDiscountDocument, OrderDiscountSchema } from "./order-discount.entity";
import { Todo } from './../../todos/entities/todo.entity';
import { OrderStatusEnum } from '../interface/order-discount';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class Order implements ITenant {
    @Prop()
    name: string;

    @Prop()
    orderCode: string;

    @Prop()
    description?: string;

    @Prop({ type: String, ref: User.name, autopopulate: { select: 'username phone avatar fullName role staffRole' } })
    createdBy: any;
    @Prop({ type: String, ref: User.name, autopopulate: { select: 'username' } })
    owner?: string;

    // @Prop({
    //     type: mongoose.Schema.Types.ObjectId, ref: ORDER_STATUS,
    //     autopopulate: { select: 'name color description' }
    // })
    // status?: any | OrderStatus;

    @Prop({type: OrderStatusEnum})
    status?: OrderStatusEnum;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: Customer.name,
        autopopulate: { select: 'fullName phone note gender' }
    })
    customers?: string | Order;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: ORDER_LABEL,
        autopopulate: { select: 'name color description' }
    })
    labels?: any | Label;
    
    @Prop({
        types: mongoose.Schema.Types.ObjectId, ref: User.name,
        autopopulate: { select: 'username fullName email avatar email birth role' }
    })
    carerStaffs: string[] | User[];
    
    @Prop()
    startDate?: Date;
    @Prop()
    dueDate?: Date;

    @Prop()
    totalMoney?: number;

    @Prop() 
    result?: string;

    @Prop({default: false}) 
    isDone: boolean;

    @Prop({default: false}) 
    isCancel: boolean;

    comments: { customer: OrderComment }[];

    products: { product: OrderProduct }[] | any;

    todos: { todo: Todo }[]| any;

    @Prop()
    surcharge: OrderSurchargeDocument[];

    @Prop()
    totalProductMoney?: number;

    @Prop()
    totalSurchargeMoney?: number;

    @Prop()
    discount: OrderDiscountDocument[];

    @Prop()
    totalDiscountMoney?: number;

    @Prop({default: false})
    requestConfirmation?: boolean;

    @Prop()
    checkoutPhoto?: string;
}
 
export type OrderDocument = Order & Document;
export const OrderSchema = SchemaFactory.createForClass(Order);
var plugins = OrderSchema.plugin(TenantPlugin.addPlugin);
OrderSchema.index({ name: 'text', description: 'text', information: 'text'})
    .index({ orderCode: 1 })
    .index({ category: 1 })
    .index({ labels: 1 })

plugins.virtual('comments', {
    ref: ORDER_COMMENT,
    justOne: false,
    localField: '_id',
    foreignField: 'order'
});

plugins.virtual('products', {
    ref: ORDER_PRODUCT,
    justOne: false,
    localField: '_id',
    foreignField: 'order'
});