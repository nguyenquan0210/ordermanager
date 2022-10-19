import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { AttrSchemaName } from 'src/attributes/interface/attrSubject';
import { AttributeDefine } from 'src/attributes/interface/attributeDefine';

@Schema({ timestamps: false, toJSON: { versionKey: false }, _id: false })
export class ProductAttribute implements AttributeDefine {
    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: AttrSchemaName.Product,
        autopopulate: { select: 'name keyName' }
    })
    attribute: string;

    @Prop({ type: mongoose.Schema.Types.Mixed })
    value: | string | number | boolean | string[] | number[]
}
export type ProductAttributeDocument = ProductAttribute & mongoose.Document;
export const ProductAttributeSchema = SchemaFactory.createForClass(ProductAttribute);
