import mongoose from "mongoose";
import { Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";
import { User } from "src/users/entities/user.entity";
import { TODO_COMMENT } from 'src/commons/constants/schemaConst';
@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class TodoComment{

  @Prop()
  contentComment: string;

  @Prop()
  todo?: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: User.name,
    autopopulate: { select: 'username fullName avatar' }
  })
  userId?: any;

  @Prop()
  userName?: string;

  @Prop([{
    type: mongoose.Schema.Types.ObjectId, ref: TODO_COMMENT,
    autopopulate: { }
  }])
  replys?: string[] | TodoComment[];

  @Prop()
  idTodo?: string;
}

export type TodoCommentDocument = TodoComment & mongoose.Document;
export const TodoCommentSchema = SchemaFactory.createForClass(TodoComment);
var plugins = TodoCommentSchema.plugin(TenantPlugin.addPlugin);
TodoCommentSchema.index({ todo: 1 });

