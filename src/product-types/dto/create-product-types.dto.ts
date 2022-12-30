import { IsOptional, IsString } from "class-validator";

export class CreateProductTypesDto {
    @IsString()
    name: string;
    @IsString()
    @IsOptional()
    description?: string;
}
