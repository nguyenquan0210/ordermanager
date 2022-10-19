import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateProductStatusDto {
    @IsString()
    name: string;
    @IsString()
    @IsOptional()
    description?: string;
    @IsString()
    @IsOptional()
    color?: string;
    @IsBoolean()
    @IsOptional()
    inactiveProduct?: boolean
}
