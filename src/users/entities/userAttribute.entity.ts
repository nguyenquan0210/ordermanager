import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { AttrSchemaName } from 'src/attributes/interface/attrSubject';
import { AttributeDefine } from 'src/attributes/interface/attributeDefine';

@Schema({ timestamps: false, toJSON: { versionKey: false }, _id: false })
export class UserAttribute implements AttributeDefine {
    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: AttrSchemaName.User,
        autopopulate: { select: 'name keyName' }
    })
    attribute: string;

    @Prop({ type: mongoose.Schema.Types.Mixed })
    value: | string | number | boolean | string[] | number[]
}
export type UserAttributeDocument = UserAttribute & mongoose.Document;
export const UserAttributeSchema = SchemaFactory.createForClass(UserAttribute);
