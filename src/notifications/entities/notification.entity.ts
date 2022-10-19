import { Document } from 'mongoose';
import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ITenant } from "src/commons/mongoosePlugins/tenant";
import { TenantPlugin } from 'src/commons/mongoosePlugins/tenant.plugin';
import { NotificationType } from 'src/commons/enum/notifications/notificationTypeEnum';
import { User } from 'src/users/entities/user.entity';
import { S3File, S3FileSchema } from 'src/storages/s3File.schema';
import { Types } from 'mongoose';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class Notifications implements ITenant {
    @Prop() 
    title: string;

    @Prop() 
    description?: string;

    @Prop({default: NotificationType.all})
    type: string | NotificationType;

    @Prop({default: false})
    isRead: boolean;

    @Prop({
        types: mongoose.Schema.Types.ObjectId, ref: User.name,
        autopopulate: { select: 'username fullName email avatar email birth' }
    })
    author: string;

    @Prop({type: Object})
    object?: object;

    owner?: string;
    @Prop() 
    relateStaff?: string;

    @Prop([S3FileSchema])
    imageVideoList: Types.Array<S3File>;

    @Prop([S3FileSchema])
    documentList: Types.Array<S3File>;

    @Prop()
    notiDate?: Date;

    @Prop()
    userRead?: string[];
    
    @Prop()
    hide?: string;

    @Prop({default: false}) 
    isRemind: boolean;

    @Prop() 
    minutes?: number;

    @Prop() 
    dateRemind?: Date;
}

export type NotificationsDocument = Notifications & Document;
export const NotificationsSchema = SchemaFactory.createForClass(Notifications);
NotificationsSchema.plugin(TenantPlugin.addPlugin);
NotificationsSchema.index({ title: 'text', description: 'text' })
