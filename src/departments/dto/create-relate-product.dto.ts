import { IsArray, IsBoolean, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
export class CreateRelateArrProductDto {
   
     @ValidateNested({ each: true })
     @Type(() => CreateRelateProductDto)
     products: CreateRelateProductDto[];

     @IsBoolean()
     wareHouse: boolean;
}

export class CreateRelateProductDto {
    /**
   * customer Id
   * @example 6130532100ca5f0097ead758
   */
     @IsMongoId()
     @IsOptional()
     productId: string;

     @IsNumber()
     quantity: number;
}