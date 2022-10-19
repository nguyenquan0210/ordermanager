import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { AttrValueType } from "../interface/attrValueType";

export class CreateAttributeDto {
    @IsString()
    name: string;
    @IsEnum(AttrValueType)
    valueType: AttrValueType;
    @IsBoolean()
    @IsOptional()
    isRequired: boolean;
}
