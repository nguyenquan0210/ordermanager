import mongoose, { Document } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';

// @Schema({ timestamps: true, toJSON: { versionKey: false } })
export class CustomerProvince {
    @Prop()
    name: string;

    @Prop()
    code: number;

    @Prop()
    division_type: string;

    @Prop()
    codename: string;

    @Prop()
    phone_code: number;

    @Prop()
    districts: any[];

}

export type CustomerProvinceDocument = CustomerProvince & Document;

export const CustomerProvinceSchema = SchemaFactory.createForClass(CustomerProvince);
CustomerProvinceSchema.index({ name: 'text' })
.index({ code: 1 })
