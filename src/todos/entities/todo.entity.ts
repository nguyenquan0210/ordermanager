import { Label } from './../../labels/entities/label.entity';
import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ITenant } from "src/commons/mongoosePlugins/tenant";
import { User } from "src/users/entities/user.entity";
import { TodoPriority } from "../interface/todo-status";
import { Document, Types } from "mongoose";
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";
import { Product } from "src/products/entities/product.entity";
import { S3File, S3FileSchema } from "src/storages/s3File.schema";
import { TodoTarget } from "../interface/todo-target";
import { CUSTOMER_RELATE_TODO, PRODUCT_RELATE_TODO, TODO_STATUS, TODO_LABEL, TODO_COMMENT } from 'src/commons/constants/schemaConst';
import { Customer } from 'src/customers/entities/customer.entity';
import { TodoDemand } from './todo-demand.entity';
import { Order } from 'src/orders/entities/order.entity';
import { TodoComment } from './todo-comment.entity';

@Schema({ timestamps: true })
export class Todo implements ITenant {
    @Prop() 
    name: string;

    @Prop() 
    description?: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: TODO_STATUS,
        autopopulate: { select: 'name color description' }
    })
    status: any|Label ;

    @Prop([{
        type: mongoose.Schema.Types.ObjectId, ref: TODO_LABEL,
        autopopulate: { select: 'name color description' }
    }])
    labels?: string[] | Label[];

    @Prop({
        type: String, ref: Order.name,
        autopopulate: { select: 'name description status carerStaffs labels  orderCode createdBy owner' }
    })
    orders?: string[];

    @Prop({
        type: String, default: TodoPriority.Low,
        enum: [
            TodoPriority.Low, 
            TodoPriority.Medium,
            TodoPriority.High
        ]
    })
    priority?: TodoPriority;

    @Prop({ type: String, ref: User.name, autopopulate: { select: 'username' } })
    createdBy: any;
    @Prop({ type: String, ref: User.name, autopopulate: { select: 'username' } })
    owner?: string;

    // @Prop([S3FileSchema])
    // attachments: Types.Array<S3File>;

    @Prop({ trim: true })
    cancelReason?: string;

    @Prop()
    startDate?: Date;
    @Prop()
    dueDate?: Date;

    @Prop({
        type: String, default: TodoTarget.Customer,
        enum: [
            TodoTarget.Customer, TodoTarget.Internal,
        ]
    })
    target: string

    @Prop([{
        type: mongoose.Schema.Types.ObjectId, ref: User.name,
        autopopulate: { select: 'username fullName' }
    }])
    assignee?: string[] | User[];

    @Prop([{
        type: mongoose.Schema.Types.ObjectId, ref: User.name,
        autopopulate: { select: 'username fullName birth phone avatar' }
    }])
    relateStaffs: any | User[];

    @Prop([{type: mongoose.Schema.Types.ObjectId}])
    relateDemands: Types.Array<TodoDemand>;

    @Prop() 
    result?: string;

    @Prop({default: false}) 
    isDone: boolean;

    @Prop({default: false}) 
    isNotification: boolean;

    @Prop() 
    minutes?: number;

    @Prop() 
    dateNoti?: Date;

    /** Virtual field */
    relateProducts: { product: Product }[];

    relateCustomers: { customer: Customer }[];

    comments: { customer: TodoComment }[];
}
export type TodoDocument = Todo & Document;

export const TodoSchema = SchemaFactory.createForClass(Todo);
var plugins = TodoSchema.plugin(TenantPlugin.addPlugin)
    .index({ name: 'text', description: 'text' })
    .index({ isDone: 1 });

plugins.virtual('relateProducts', {
    ref: PRODUCT_RELATE_TODO,
    justOne: false,
    localField: '_id',
    foreignField: 'todo'
});

plugins.virtual('relateCustomers', {
    ref: CUSTOMER_RELATE_TODO,
    justOne: false,
    localField: '_id',
    foreignField: 'todo'
});

plugins.virtual('comments', {
    ref: TODO_COMMENT,
    justOne: false,
    localField: '_id',
    foreignField: 'todo'
});