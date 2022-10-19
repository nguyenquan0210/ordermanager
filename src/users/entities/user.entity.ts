import mongoose from 'mongoose';
import { UserRole, StaffRole, LevelAccount, TypeCommission } from "../interface/userRoles";
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Gender, VerifyStatus } from "src/commons/define";
import { UserAttributeDocument, UserAttributeSchema } from './userAttribute.entity';
import { Types } from 'mongoose';
import { ShowCustommer } from "../interface/register-customer";


@Schema({
    timestamps: true,
    toJSON: { versionKey: false }
})
export class User {
    @Prop()
    staffCode?: string;

    @Prop({ required: true, lowercase: true })
    username: string;

    @Prop({ select: false })
    password: string;

    @Prop({ default: UserRole.Staff })
    role?: UserRole;

    @Prop()
    avatar: string;

    @Prop({ lowercase: true })
    email: string;

    @Prop({ type: Date })
    birth: Date | string;

    @Prop({ default: Gender.Other })
    gender: Gender;

    @Prop()
    lastLogin: Date;

    @Prop()
    fullName: string;

    @Prop()
    address: string;

    @Prop({ default: VerifyStatus.Pending })
    verify: VerifyStatus;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: User.name,
        autopopulate: { select: 'username fullName' }
    })
    owner?: string;

    // @Prop() 
    // zaloUrl?: string;

    @Prop()
    phone?: string;

    // @Prop() 
    // facebookUrl?: string;

    @Prop([UserAttributeSchema])
    attributes: Types.Array<UserAttributeDocument>

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: User.name,
        autopopulate: { select: 'username fullName' }
    })
    manager?: string;

    @Prop()
    createdBy?: string;

    @Prop({ default: [] })
    staffRole?: StaffRole[];

    @Prop()
    position?: string;

    @Prop({
        type: String, default: ShowCustommer.public,
        enum: [
            ShowCustommer.public, ShowCustommer.private,
        ]
    })
    showCustommer: string;

    @Prop([{
        type: String,
    }])
    tokenFirebase?: Types.Array<string>;

    @Prop({ default: false })
    lock: boolean;

    @Prop()
    sizeFile?: number;

    @Prop()
    currencyUnit?: string;

    @Prop({ select: false })
    levelAccount?: LevelAccount;

    @Prop()
    commission?: TypeCommission

    @Prop()
    urlSocialNetwork?: string[];

    @Prop()
    defaultLanguage: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ username: 1 });
UserSchema.index({ owner: 1 });
UserSchema.index({ fullName: 'text', email: 'text', phone: 'text' });
