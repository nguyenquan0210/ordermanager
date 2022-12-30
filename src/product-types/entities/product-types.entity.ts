import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ITenant } from "src/commons/mongoosePlugins/tenant";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class ProductTypes implements ITenant {
    @Prop() name: string;
    @Prop() description?: string;
    @Prop() icon?: string;

    owner?: string;
}

export type ProductTypesDocument = ProductTypes & Document;

export const ProductTypesSchema = SchemaFactory.createForClass(ProductTypes);

ProductTypesSchema.plugin(TenantPlugin.addPlugin);
