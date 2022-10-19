import mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Todo } from "./todo.entity";
import { User } from "src/users/entities/user.entity";
import { StatusHistory } from "src/commons/dto/status.dto";

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class TodoHistory {
  @Prop({
    types: mongoose.Schema.Types.ObjectId, ref: Todo.name,
    autopopulate: { select: 'name' }
  })
  todo: string;
  
  @Prop({ type: mongoose.Schema.Types.Mixed })
  before: object;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  after: object;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  change: object;

  @Prop()
  status: string | StatusHistory;

  @Prop({
    types: mongoose.Schema.Types.ObjectId, ref: User.name,
    autopopulate: { select: 'username fullName email avatar' }
  })
  updatedBy: string;
}

export type TodoHistoryDocument = TodoHistory & mongoose.Document;
export const TodoHistorySchema = SchemaFactory.createForClass(TodoHistory);
TodoHistorySchema.index({product: 1})
