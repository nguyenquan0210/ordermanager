import { IsString, IsMongoId, IsOptional } from "class-validator";

export class CreateFeedbackDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;
}
