import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {  Document } from "mongoose";
import { deleteFile } from "src/commons/utils/s3Client";

@Schema({ timestamps: true })
export class S3File {
    @Prop()
    name: string;
    @Prop()
    description?: string;
    @Prop()
    url: string;
    @Prop()
    mimetype: string;
    @Prop()
    size: number;

    // function
    public deleteFile?(): void;
}

export type S3FileDocument = S3File & Document;
export const S3FileSchema = SchemaFactory.createForClass(S3File);

S3FileSchema.methods.deleteFile = function (this: S3FileDocument) {
    if (this.url) {
        deleteFile(this.url);
    }
}