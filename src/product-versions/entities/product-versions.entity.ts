import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ITenant } from "src/commons/mongoosePlugins/tenant";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class ProductVerstions implements ITenant {
    @Prop() name: string;
    @Prop() description?: string;
    @Prop() icon?: string;

    owner?: string;
}

export type ProductVerstionsDocument = ProductVerstions & Document;

export const ProductVerstionsSchema = SchemaFactory.createForClass(ProductVerstions);

ProductVerstionsSchema.plugin(TenantPlugin.addPlugin);
