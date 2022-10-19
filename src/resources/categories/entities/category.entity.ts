import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { ITenant } from "src/commons/mongoosePlugins/tenant";
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";

@Schema({ timestamps: true })
export class Category implements ITenant {
    owner?: string;
    @Prop() name: string;
    @Prop() description?: string;
}

export type CategoryDocument = Category & mongoose.Document;

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.plugin(TenantPlugin.addPlugin);
