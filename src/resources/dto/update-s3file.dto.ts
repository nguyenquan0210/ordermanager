import { IsOptional, IsString } from "class-validator";

export class UpdateS3FileDto {
    @IsOptional()
    @IsString()
    name: string;
    @IsOptional()
    @IsString()
    description?: string;
}
