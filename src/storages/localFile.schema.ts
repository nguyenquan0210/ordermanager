import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { StaticFile } from "src/commons/utils/staticFile";

@Schema({ timestamps: true })
export class LocalFile {
    @Prop()
    name: string;
    @Prop()
    url: string;
    @Prop()
    mimetype: string;
    @Prop()
    size: number;

    // function
    public deleteFile?(): void;
}

export type LocalFileDocument = LocalFile & Document;
export const LocalFileSchema = SchemaFactory.createForClass(LocalFile);

LocalFileSchema.methods.deleteFile = function (this: LocalFileDocument) {
    if (this.url) {
        StaticFile.deleteStaticFile(StaticFile.getLocalFile(this.url));
    }
}
