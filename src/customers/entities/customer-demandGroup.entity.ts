import mongoose from 'mongoose';
import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from 'src/users/entities/user.entity';
import { ITenant } from 'src/commons/mongoosePlugins/tenant';
import { CUSTOMER_LABEL } from 'src/commons/constants/schemaConst';
import { Label } from 'src/labels/entities/label.entity';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class CustomerDemandGroups implements ITenant {
    @Prop()
    groupName: string;

    @Prop({
        type: String, ref: User.name,
        autopopulate: { select: 'username' }
    })
    owner?: string;

    @Prop([{
        type: mongoose.Schema.Types.ObjectId, ref: CUSTOMER_LABEL,
        autopopulate: { select: 'name color description' }
    }])
    demands: string[] | Label[];
}

export type CustomerDemandGroupsDocument = CustomerDemandGroups & Document;
export const CustomerDemandGroupsSchema = SchemaFactory.createForClass(CustomerDemandGroups);
