import { IsArray, IsDateString, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from "class-validator";
import { DemandTarget } from "../../interface/demand-target";
export class CreateTodoDemandDto {
    @IsString()
    name: string;
  
    @IsString()
    @IsOptional()
    description: string;

    @IsDateString()
    startTime: Date;

    @IsDateString()
    endTime?: Date;

    @IsString()
    status: string;

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    labels?: string[];

    @IsNumber()
    @IsOptional()
    relate?: number;

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    customers?: string[];

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    products?: string[];

    @IsArray()
    @IsMongoId({ each: true })
    @IsNotEmpty()
    @IsOptional()
    relateTodos: string[];
    /**
     * target of todo. Default is `low`
     * @example [customer, product]
     */
    @IsEnum(DemandTarget)
    @IsOptional()
    target?: string;
}