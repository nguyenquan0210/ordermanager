import { IsOptional, IsString, IsMongoId, IsEnum, IsNumber, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
import { Status } from "src/commons/enum/status.enum";

export class CreateSuppliersDto {
    @IsString()
    name: string;

    @IsString()
    address: string; 
    
    @IsString()
    email: string; 

    @IsString()
    phone: string; 
    /**
     * status
     * @example "[active, inactive]"
     */
    @IsEnum(Status)
    status: Status;
}

