import { IsArray, IsMongoId, IsOptional, IsString, IsNumber } from "class-validator";

export class CreateProductRelateColorDto {
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
  color: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  money: number;

  @IsNumber()
  departmentMoney: number;

  @IsString()
  @IsOptional()
  note?: string;
}