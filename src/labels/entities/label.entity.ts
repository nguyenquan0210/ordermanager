import { Document } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "src/users/entities/user.entity";
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class Label {
    @Prop() name: string;
    @Prop() description?: string;
    @Prop() color?: string;

    owner?: User | string;
}

export type LabelDocument = Label & Document;

export const LabelSchema = SchemaFactory.createForClass(Label);
LabelSchema.plugin(TenantPlugin.addPlugin);
