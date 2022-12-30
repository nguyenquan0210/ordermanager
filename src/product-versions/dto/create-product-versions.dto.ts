import { IsOptional, IsString } from "class-validator";

export class CreateProductVerstionsDto {
    @IsString()
    name: string;
    @IsString()
    @IsOptional()
    description?: string;
}
