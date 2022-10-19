import { IsNumber ,ValidateNested } from "class-validator";
import { Type } from 'class-transformer';

export class CreateCommissionDto {
    @IsNumber()
    totalMoney: number;

    @IsNumber()
    percentCommission: number;
}
export class CreateArrCommissionDto {
    // @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCommissionDto)
    Commissions: CreateCommissionDto[];
}
