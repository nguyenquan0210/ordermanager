import { IsEnum, IsMongoId, IsOptional, IsString } from "class-validator";
import { ResourceType } from "../inteface/resourceType";

export class CreateResourceDto {
    @IsString()
    name: string;

    /**
     * 
     * @example "[image, video, audio, file]"
     */
    @IsString()
    @IsEnum(ResourceType)
    type: ResourceType;

    @IsString()
    @IsOptional()
    description?: string;

    /**
     * id category
     * @example "6118e9fcb952b9001ce3a9ea"
     */
    @IsMongoId()
    @IsOptional()
    category?: string;

}
