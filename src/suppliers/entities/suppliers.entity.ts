import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Status } from 'src/commons/enum/status.enum';

@Schema({ timestamps: true, toJSON: { versionKey: false } })
export class Suppliers {
    @Prop() 
    name: string;

    @Prop() 
    address: string;

    @Prop() 
    email: string;

    @Prop() 
    phone?: string;

    @Prop({default: Status.Active}) 
    status?: Status;

}

export type SuppliersDocument = Suppliers & Document;
export const SuppliersSchema = SchemaFactory.createForClass(Suppliers);
