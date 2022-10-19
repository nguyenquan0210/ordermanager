import { IsOptional, IsString } from "class-validator";

export class CreateLabelDto {
    @IsString()
    name: string;

    @IsString()
    color: string;

    @IsString()
    @IsOptional()
    description?: string;
}
