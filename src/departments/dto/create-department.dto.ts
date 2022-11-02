import { IsString, IsMongoId, IsOptional } from "class-validator";

export class CreateDepartmentDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    address: string;

    @IsMongoId()
    @IsOptional()
    locations: string;

    @IsMongoId()
    @IsOptional()
    userId: string;
}
