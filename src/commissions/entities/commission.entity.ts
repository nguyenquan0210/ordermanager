import { Document } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "src/users/entities/user.entity";
import { TenantPlugin } from "src/commons/mongoosePlugins/tenant.plugin";

@Schema({ timestamps: true, toJSON: { versionKey: false } })

export class Commission {
    @Prop() 
    totalMoney: number;

    @Prop() 
    percentCommission: number;

    owner?: User | string;
}

export type CommissionDocument = Commission & Document;

export const CommissionSchema = SchemaFactory.createForClass(Commission);
CommissionSchema.plugin(TenantPlugin.addPlugin);
