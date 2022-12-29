import { IsArray, IsBoolean, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
export class CreateRelateArrColorDto {

    @ValidateNested({ each: true })
    @Type(() => CreateRelateColorDto)
    colors: CreateRelateColorDto[];

}

export class CreateRelateColorDto {
   /**
  * customer Id
  * @example 6130532100ca5f0097ead758
  */
    @IsMongoId()
    color: string;

    @IsNumber()
    quantity: number;

    @IsNumber()
    money: number;
}