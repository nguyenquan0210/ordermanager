import { IsObject, IsString, IsArray, IsBoolean,IsEnum } from "class-validator";
import { TypeCommission } from "../interface/userRoles";

export class ChangeCommissionDto {
    /**
     * @example [Incremental, Reset]
     */
    @IsEnum(TypeCommission)
    @IsString()
    commission: TypeCommission;
}