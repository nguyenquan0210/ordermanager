import { IsArray, IsMongoId, IsOptional, IsString, IsDateString, IsNumber, ValidateNested, IsBoolean, IsEnum } from "class-validator";
import { Type } from 'class-transformer';
import { OrderStatusEnum, StyleDiscount } from "../interface/order-discount";
export class CreateOrderDto {
   
    @IsString()
    name: string;

    // @IsString()
    // @IsOptional()
    // orderCode: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(OrderStatusEnum)
    @IsOptional()
    status: string;

    @IsMongoId()
    @IsOptional()
    labels: string;

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    carerStaffs: string[];

    @IsMongoId()
    customers: string;

    // @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderProductDto)
    products: OrderProductDto[];
   
    @IsDateString()
    startDate?: Date;

    @IsDateString()
    dueDate?: Date;

    @IsString()
    @IsOptional()
    result?: string;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => Surcharge)
    surcharge: Surcharge[];

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => Discount)
    discount: Discount[];
}

export class OrderProductDto {
    @IsString()
    product: string;

    /**
     * @example 1
     */
    @IsNumber()
    quantity: number;
}
  
class Surcharge {
    @IsString()
    nameSurcharge: string;

    @IsNumber()
    priceSurcharge: number;
}

class Discount {
    /**
     * style of discount
     * @example [money, percent]
     */
    @IsEnum(StyleDiscount)
    styleDiscount: string;

    @IsNumber()
    moneyDiscount: number;
}
   


