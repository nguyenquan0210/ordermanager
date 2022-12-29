import { IsArray, IsMongoId, IsOptional, IsString, IsNumber } from "class-validator";

export class CreateDepartmentDetailtDto {
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

  /**
 * deparment Id
 * @example 6130532100ca5f0097ead751
 */
  @IsMongoId()
  department: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  money: number;

  @IsString()
  unit: string;

}