import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ITenant } from "src/commons/mongoosePlugins/tenant";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class SpeakerStyle implements ITenant {
    @Prop() 
    name: string;
    @Prop() 
    description?: string;

    owner?: string;
}

export type SpeakerStylesDocument = SpeakerStyle & Document;

export const SpeakerStyleSchema = SchemaFactory.createForClass(SpeakerStyle);

SpeakerStyleSchema.plugin(TenantPlugin.addPlugin);
