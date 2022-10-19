import { Document } from 'mongoose';
import mongoose from 'mongoose';
import { S3File, S3FileSchema } from 'src/storages/s3File.schema';
import { Types } from 'mongoose';
import { SPEAKER_STYLE } from 'src/commons/constants/schemaConst';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ITenant } from "src/commons/mongoosePlugins/tenant";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { SpeakerStyle } from '../../speaker-styles/entities/speaker-style.entity'

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class Speakers implements ITenant {
    @Prop() 
    title: string;

    @Prop() 
    description?: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: SPEAKER_STYLE,
        autopopulate: { select: 'name description' }
    })
    style: string | SpeakerStyle;

    @Prop([S3FileSchema])
    imageVideoList: Types.Array<S3File>;

    @Prop([S3FileSchema])
    documentList: Types.Array<S3File>;

    owner?: string;
}

export type SpeakersDocument = Speakers & Document;

export const SpeakersSchema = SchemaFactory.createForClass(Speakers);
SpeakersSchema.plugin(TenantPlugin.addPlugin);
