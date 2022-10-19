import { Optional } from "@nestjs/common";
import { IsNumberString } from "class-validator";

export class Paginate {
    @Optional()
    @IsNumberString()
    limit?: number;
    @Optional()
    offset?: number;
}