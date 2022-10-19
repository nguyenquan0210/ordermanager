import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { S3File, S3FileSchema } from "src/storages/s3File.schema";
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";
import { ITenant } from "src/commons/mongoosePlugins/tenant";
import { ResourceType } from "../inteface/resourceType";
import { RESOURCE_CTG } from "src/commons/constants/schemaConst";
import { User } from "src/users/entities/user.entity";

@Schema({ timestamps: true })
export class Resource {
    @Prop() name: string;

    @Prop({ type: [S3FileSchema] })
    files: S3File[];

    @Prop() 
    description?: string;
    
    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: RESOURCE_CTG,
        autopopulate: { select: 'name' }
    })
    category: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: User.name,
        autopopulate: { select: 'fullName email avatar phone' }
    })
    createdBy: string;

    @Prop() 
    type: ResourceType;

    @Prop({default: 0}) 
    size: number;

}

export type ResourceDocument = Resource & mongoose.Document;

export const ResourceSchema = SchemaFactory.createForClass(Resource);
ResourceSchema.plugin(TenantPlugin.addPlugin);
