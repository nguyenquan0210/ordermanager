import { IsArray, IsMongoId, IsOptional, IsString } from "class-validator";

export class CreateProductRelateTodoDto {
  /**
   * product Id
   * @example 6130532100ca5f0097ead758
   */
  @IsMongoId()
  product: string;
  /**
   * todo Id
   * @example 6130532100ca5f0097ead751
   */
  @IsMongoId()
  todo: string;

  @IsString()
  @IsOptional()
  note?: string;
}