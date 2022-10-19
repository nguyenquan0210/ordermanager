import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ITenant } from 'src/commons/mongoosePlugins/tenant';
import { AttrValueType } from '../interface/attrValueType';
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class Attribute implements ITenant {

    @Prop()
    name: string;

    @Prop({
        type: String, default: AttrValueType.string,
        enum: [
            AttrValueType.string,
            AttrValueType.number,
            AttrValueType.boolean,
            AttrValueType.array_number,
            AttrValueType.array_string,
        ],
    })
    valueType: AttrValueType;
    @Prop()
    keyName: string; // gen by slug from name
    @Prop({ default: false })
    isRequired: boolean;

    owner?: string;
}

export type AttributeDocument = Attribute & mongoose.Document;

export const AttributeSchema = SchemaFactory.createForClass(Attribute);

AttributeSchema.index({ keyName: 1, owner: 1 });
AttributeSchema.plugin(TenantPlugin.addPlugin);
