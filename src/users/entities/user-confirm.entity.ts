import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ConfirmCodeScope } from '../interface/confirmCodeScope';

@Schema({ versionKey: false })
export class UserConfirmCode {
    @Prop() userId: string;
    @Prop() token: string;

    @Prop() email: string;

    @Prop({ default: Date.now, expires: 600 })
    createdAt: Date;
    @Prop()
    scope: ConfirmCodeScope
}
export type UserConfirmCodeDocument = UserConfirmCode & mongoose.Document;
export const UserConfirmCodeSchema = SchemaFactory.createForClass(UserConfirmCode);
