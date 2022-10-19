import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateOrderStatusDto {
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
    inactiveOrder?: boolean
}
