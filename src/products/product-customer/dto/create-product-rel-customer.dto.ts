import { IsArray, IsMongoId, IsOptional, IsString } from "class-validator";

export class CreateProductRelateCustomerDto {
  /**
   * Product Id
   * @example 6130532100ca5f0097ead758
   */
  @IsMongoId()
  product: string;
  /**
   * Customer Id
   * @example 6130532100ca5f0097ead751
   */
  @IsMongoId()
  customer: string;
  @IsString()
  @IsOptional()
  note?: string;
}

export class CustomerIdsDto {
  /** 
   * Product Id
   */
  @IsMongoId()
  product: string;
  /**
   * Array of customer id
   * @example ["6130532100ca5f0097ead758"]
   */
  @IsArray()
  @IsMongoId({ each: true })
  customers: string[]
}
