import { IsString, IsMongoId, IsOptional, IsNumber, ValidateNested} from "class-validator";
import { Type } from 'class-transformer';
import { CreateRelateColorDto } from "src/products/products-ralate-color/dto/create-product-rle-arr-color.dto";

export class CreateDepartmentDto {
    @IsString()
    @IsOptional()
    description?: string;

    @IsMongoId()
    @IsOptional()
    supplier: string;

    @ValidateNested({ each: true })
    @Type(() => CreateProductDetailtDto)
    products: CreateProductDetailtDto[];
}

export class CreateProductDetailtDto {
    @IsMongoId()
    @IsOptional()
    product: string;

    @ValidateNested({ each: true })
    @Type(() => CreateRelateColorDto)
    colors: CreateRelateColorDto[];
}
