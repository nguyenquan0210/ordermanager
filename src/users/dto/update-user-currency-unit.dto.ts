import { IsString } from "class-validator";

export class UpdateUserCurrencyUnitDto {
    @IsString()
    currencyUnit: string;
}
