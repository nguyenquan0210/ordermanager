import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ITenant } from "src/commons/mongoosePlugins/tenant";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class ProductCategory implements ITenant {
    @Prop() name: string;
    @Prop() description?: string;
    @Prop() icon?: string;

    owner?: string;
}

export type ProductCategoryDocument = ProductCategory & Document;

export const ProductCategorySchema = SchemaFactory.createForClass(ProductCategory);

ProductCategorySchema.plugin(TenantPlugin.addPlugin);
