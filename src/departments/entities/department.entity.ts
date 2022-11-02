import mongoose from "mongoose";
import { Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";
import { User } from "src/users/entities/user.entity";
import { S3File, S3FileSchema } from "src/storages/s3File.schema";

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Department {

    @Prop()
    name: string;

    @Prop()
    descripton?: string;

    @Prop()
    isDeleted: boolean;
   
    @Prop()
    address?: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: User.name,
        autopopulate: { select: 'username fullName avatar phone' }
    })
    userId: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: User.name,
        autopopulate: { select: 'username' }
    })
    owner: string;

}

export type DepartmentDocument = Department & mongoose.Document;
export const DepartmentSchema = SchemaFactory.createForClass(Department);
var plugins = DepartmentSchema.plugin(TenantPlugin.addPlugin);
DepartmentSchema.index({ name: 1 , owner: 1});

