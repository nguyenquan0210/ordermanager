import { IsMongoId, IsOptional, IsString } from "class-validator";

export class CreateCustomerNoteDto {
    /**
   * customer Id
   * @example 6130532100ca5f0097ead758
   */
    @IsMongoId()
    customer: string;

    @IsString()
    @IsOptional()
    note: string;
}