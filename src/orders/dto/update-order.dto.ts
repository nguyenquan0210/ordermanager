import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { IsArray, IsMongoId, IsOptional, IsString, IsDateString, IsNumber } from "class-validator";
import { OrderProduct } from "../entities/order-product.entity";
import { OrderSurcharge } from "../entities/order-surcharge.entity";
import { OrderDiscount } from "../entities/order-discount.entity";

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
    @IsNumber()
    @IsOptional()
    totalMoney?: number;

    @IsNumber()
    @IsOptional()
    totalProductMoney?: number;

    @IsNumber()
    @IsOptional()
    totalSurchargeMoney?: number;

    @IsNumber()
    @IsOptional()
    totalDiscountMoney?: number;
}
