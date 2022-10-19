import { IsArray, IsMongoId, IsOptional, IsString } from "class-validator";
import { Customer } from "src/customers/entities/customer.entity";

export class CreateCustomerRelateStaffDto {
  /**
   * customer Id
   * @example 6130532100ca5f0097ead758
   */
  @IsMongoId()
  customer: string | Customer;
  /**
   * staff Id
   * @example 6130532100ca5f0097ead751
   */
  @IsMongoId()
  staff: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class TodoIdsDto {
  /** 
   * customer Id
   */
  @IsMongoId()
  customer: string;
  /**
   * Array of customer id
   * @example ["6130532100ca5f0097ead758"]
   */
  @IsArray()
  @IsMongoId({ each: true })
  staffs: string[]
}
