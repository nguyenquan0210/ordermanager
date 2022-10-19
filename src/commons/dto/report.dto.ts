import { Optional } from "@nestjs/common";
import { Prop } from "@nestjs/mongoose";
import { IsNumberString } from "class-validator";
import { Quarter } from "../enum/quarters.enum";

export class Report {
    @Optional()
    @IsNumberString()
    year?: Date;

    @Optional()
    month?: Date;

    start?: Date;
    
    end?: Date;

    @Optional()
    isMonth: Boolean;
}