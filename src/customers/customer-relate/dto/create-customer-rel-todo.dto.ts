import { IsArray, IsMongoId, IsOptional, IsString } from "class-validator";

export class CreateCustomerRelateTodoDto {
  /**
   * Customer Id
   * @example 6130532100ca5f0097ead758
   */
  @IsMongoId()
  customer: string;
  /**
   * product Id
   * @example 6130532100ca5f0097ead751
   */
  @IsMongoId()
  todo: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class TodoIdsDto {
  /** 
   * Product Id
   */
  @IsMongoId()
  customer: string;
  /**
   * Array of customer id
   * @example ["6130532100ca5f0097ead758"]
   */
  @IsArray()
  @IsMongoId({ each: true })
  todos: string[]
}
