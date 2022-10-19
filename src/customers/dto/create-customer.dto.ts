import {
    IsArray, IsDateString, IsEmail, IsMobilePhone, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested
} from "class-validator";
import { CustomerAttribute } from "../entities/customer-attribute.entity";
import { Gender } from "src/commons/define";
import { RelateCustomerDto } from "./relate-customer.dto";
import { Type } from "class-transformer";

export class CreateCustomerDto {
    @IsString()
    fullName?: string;
    
    @IsMobilePhone('vi-VN')
    phone?: string;
    
    @IsEmail()
    @IsOptional()
    email?: string;
    
    @IsOptional()
    @IsDateString()
    birth?: Date;
    
    @IsString()
    @IsOptional()
    gender: Gender;
    
    // @IsOptional()
    // @IsString()
    // zaloUrl?: string;
    
    // @IsOptional()
    // @IsString()
    // facebookUrl?: string;
    
    @IsOptional()
    avatar?: string;
    
    @IsString()
    @IsOptional()
    country?: string;

    @IsString()
    @IsOptional()
    addressCity?: string;

    @IsString()
    @IsOptional()
    addressDistrict?: string;

    @IsString()
    @IsOptional()
    address?: string;
    
    @IsString()
    @IsOptional()
    note?: string;

    @IsString()
    @IsOptional()
    relateCustomer?: string;

    @IsArray()
    @IsOptional()
    attributes: CustomerAttribute[];

    /**
     * Array of label's id
     * @example ["6118e9fcb952b9001ce3a9ea"]
     */
    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    labels?: string[];

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    carerStaffs?: string[];

    /**
     * Array of staff's id
     * @example ["6118e9fcb952b9001ce3a9eb"]
     */
    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    relateStaffs?: string[];

    /**
     * Array of staff's id
     * @example ["6118e9fcb952b9001ce3a9eb"]
     */
    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    relateProducts?: string[];

    /**
     * Array of staff's id
     * @example ["6118e9fcb952b9001ce3a9eb"]
     */
    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    relateTodos?: string[];

    @IsNumber()
    @IsOptional()
    nhucauMinGia?: number;
    @IsNumber()
    @IsOptional()
    nhucauMaxGia?: number;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => RelateCustomerDto)
    relateCustomers?: RelateCustomerDto[];

    @IsArray()
    @IsOptional()
    urlSocialNetwork?: string[];
}
