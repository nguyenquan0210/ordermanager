import mongoose from "mongoose";
import { Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";
import { User } from "src/users/entities/user.entity";
import { S3File, S3FileSchema } from "src/storages/s3File.schema";
import { FeedbackStatus } from "../interface/feedbackstatus";

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Feedback {

    @Prop()
    title: string;

    @Prop()
    descripton?: string;

    @Prop({ default: FeedbackStatus.WAITING })
    status: FeedbackStatus;

    @Prop([S3FileSchema])
    imageList?: Types.Array<S3File>;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: User.name,
        autopopulate: { select: 'username fullName avatar phone' }
    })
    userId: string;

}

export type FeedbackDocument = Feedback & mongoose.Document;
export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
var plugins = FeedbackSchema.plugin(TenantPlugin.addPlugin);
FeedbackSchema.index({ userId: 1 });

