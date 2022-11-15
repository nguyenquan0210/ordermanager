import { IsArray, IsMongoId, IsOptional, IsString, IsNumber } from "class-validator";

export class CreateProductRelateDepartmentDto {
  /**
   * product Id
   * @example 6130532100ca5f0097ead758
   */
  @IsMongoId()
  product: string;
  /**
   * deparment Id
   * @example 6130532100ca5f0097ead751
   */
  @IsMongoId()
  department: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  note?: string;
}