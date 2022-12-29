import mongoose from "mongoose";
import { Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";
import { User } from "src/users/entities/user.entity";
import { S3File, S3FileSchema } from "src/storages/s3File.schema";
import { Suppliers } from "src/suppliers/entities/suppliers.entity";
import { DepartmentDetailts } from "./department-detailt.entity";
import { DEPARTMENT_DETAILT } from "src/commons/constants/schemaConst";

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Department {

    // @Prop()
    // name: string;

    @Prop()
    descripton?: string;

    @Prop({default:false})
    isDeleted: boolean;
   
    @Prop({default:0})
    totalMoney: number;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: Suppliers.name,
        autopopulate: { select: 'name email phone address' }
    })
    supplier: string;

        /** Virtual field */
    departmentDetailt?: { detailt: DepartmentDetailts }[];

}

export type DepartmentDocument = Department & mongoose.Document;
export const DepartmentSchema = SchemaFactory.createForClass(Department);
var plugins = DepartmentSchema.plugin(TenantPlugin.addPlugin);
DepartmentSchema.index({ name: 1 , owner: 1});

plugins.virtual('departmentDetailt', {
    ref: DEPARTMENT_DETAILT,
    justOne: false,
    localField: '_id',
    foreignField: 'department'
});