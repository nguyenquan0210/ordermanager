import { IsMongoId, IsString } from "class-validator";

export class RelateCustomerDto {
    /**
     * @example anh
     */
    @IsString()
    relateName: string;
    /**
     * @example 625bbefc83717700676072c9
     */
    @IsMongoId()
    customer1: string;
}