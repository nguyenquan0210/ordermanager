import { Allow, IsMongoId } from "class-validator";

export class CustomerAttributeDto {
    /**
     * ID of Product defined attribute
     * @example 60f23bd3f7e30a007858ca69
     */
    @IsMongoId()
    attribute: string;
    /**
     * Value for attribute
     */
    @Allow()
    value: | string | number | boolean | string[] | number[];
}