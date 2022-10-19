import { IsNumber, IsMongoId, IsOptional, IsDateString } from "class-validator";

export class CreateUserKPIDto {
    @IsMongoId()
    userId: string;

    @IsNumber()
    @IsOptional()
    kpiOrder?: number;

    @IsNumber()
    @IsOptional()
    kpiTotalOrder?: number;

    @IsNumber()
    @IsOptional()
    kpiTotalCustomer?: number;

    @IsDateString()
    @IsOptional()
    kpiDate?: Date;
}
