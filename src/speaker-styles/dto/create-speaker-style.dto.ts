import { IsOptional, IsString } from "class-validator";

export class CreateSpeakerStylesDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}
