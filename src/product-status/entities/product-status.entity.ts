import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ITenant } from "src/commons/mongoosePlugins/tenant";
import { User } from "src/users/entities/user.entity";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class ProductStatus implements ITenant {
    @Prop() name: string;
    @Prop() description?: string;
    @Prop() color?: string;
    @Prop({ default: false })
    inactiveProduct: boolean;

    owner?: User | string;
}

export type ProductStatusDocument = ProductStatus & Document;

export const ProductStatusSchema = SchemaFactory.createForClass(ProductStatus);

ProductStatusSchema.plugin(TenantPlugin.addPlugin);
