import {
    IsArray, IsMongoId, IsString
} from "class-validator";

export class CreateCustomerDemandGroupsDto {
    @IsString()
    groupName: string;

    /**
     * Array of demands's id
     * @example ["6118e9fcb952b9001ce3a9ea"]
     */
    @IsArray()
    @IsMongoId({ each: true })
    demands?: string[];
}
