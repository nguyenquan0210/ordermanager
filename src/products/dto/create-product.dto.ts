import { IsArray, IsBoolean, IsMongoId, IsNumber, IsOptional, IsString, IsEnum } from "class-validator";
import { defaults } from "lodash";
import { CommissionFeeTypeEnum } from "src/commons/enum/products/commissionFeeTypeEnum";
import { PriceType } from "src/commons/enum/products/priceTypeEnum";
import { ProductAttribute } from "../entities/product-attribute.entity";
import { ProductStatusEnum } from "../interface/product-status";

export class CreateProductDto {
    /**
     * Name of product
     */
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsOptional()
    attributes?: ProductAttribute[];

    /**
     * Product category id
     * @example 6118e9fcb952b9001ce3a9ea
     */
    @IsMongoId()
    @IsOptional()
    category: string;

    /**
     * Product category id
     * @example 6118e9fcb952b9001ce3a9ea
     */
    @IsMongoId()
    @IsOptional()
    type: string;

    /**
    * Product category id
    * @example 6118e9fcb952b9001ce3a9ea
    */
    @IsMongoId()
    @IsOptional()
    version: string;

    /**
     * Default is `status`
     * @example [Activate, Inactive, AlmostOver, Over]
     */
    @IsEnum(ProductStatusEnum)
    @IsOptional()
    status: ProductStatusEnum;

    /**
     * Array of label's id
     * @example ["6118e9fcb952b9001ce3a9ea"]
     */
    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    labels: string[];

    @IsNumber()
    price: number;


    @IsNumber()
    @IsOptional()
    priceSale?: number;

    @IsNumber()
    quantity: number;

    @IsString()
    @IsOptional()
    unit?: string;

    // @IsString()
    // @IsOptional()
    // priceType?: PriceType;

    // @IsNumber()
    // @IsOptional()
    // commissionFee?: number;

    // @IsString()
    // @IsOptional() 
    // commissionFeeType?: CommissionFeeTypeEnum;
    // /**
    //  * Mã lô
    //  */
    // @IsString()
    // @IsOptional()
    // malo?: string

    // @IsString()
    // @IsOptional()
    // address?: string

    // @IsString()
    // @IsOptional()
    // information?: string

    // @IsString()
    // @IsOptional()
    // code?: string

    // @IsNumber()
    // @IsOptional()
    // dientich?: number

    @IsBoolean()
    @IsOptional()
    isHot?: boolean = false

    @IsString()
    @IsOptional()
    note?: string

    // @IsString()
    // @IsOptional()
    // direction?: string

    /**
     * Array of todo's id
     * @example ["6118e9fcb952b9001ce3a9eb"]
     */

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    relateTodos?: string[];

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    carerStaffs: string[];


    @IsString()
    @IsOptional()
    productCode?: string
}
