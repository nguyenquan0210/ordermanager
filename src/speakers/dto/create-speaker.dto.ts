import { IsArray, IsMongoId, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateSpeakersDto {
    /**
     * title of speaker
     */
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    /**
     * speaker style id
     * @example 6118e9fcb952b9001ce3a9ea
     */
    @IsMongoId()
    style: string;
}
