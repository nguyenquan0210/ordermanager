import { IsMongoId, IsString } from "class-validator";

export class CreateCustomerRelateCustomerDto {
    @IsMongoId()
    customer: string;
    @IsMongoId()
    customer1: string;

    @IsString()
    relateName: string;
}
