import {
    IsArray, IsDateString, IsEmail, IsEnum, IsMongoId, IsOptional, IsMobilePhone, IsString, MaxLength,
    MinLength
} from "class-validator";
import { UserAttribute } from "../entities/userAttribute.entity";
import { UserRole, StaffRole } from "../interface/userRoles";

export class CreateUserDto {
    @IsString()
    @IsOptional()
    staffCode?: string;

    @IsString()
    fullName: string;

    @IsEmail()
    email: string;

    @MinLength(6)
    password: string;

    @IsMobilePhone('vi-VN')
    phone?: string;
    
    @IsString()
    @IsOptional()
    address?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
    
    // @IsOptional()
    // zaloUrl?: string;
    // @IsOptional()
    // facebookUrl?: string;

    // @IsArray()
    // @IsOptional()
    // attributes?: UserAttribute[];

    @IsMongoId()
    @IsOptional()
    manager?: string;

    @IsDateString()
    @IsOptional()
    birth?: string;

    @IsOptional()
    messageUrl?: string;

    @IsArray()
    @IsOptional()
    staffRole?: StaffRole[];

    @IsString()
    position?: string;

    @IsArray()
    @IsOptional()
    urlSocialNetwork?: string[];
}
