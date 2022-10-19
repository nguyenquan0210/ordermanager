import { IsEmail, IsOptional, IsMobilePhone, IsString, IsEnum } from "class-validator";
import { ShowCustommer } from "src/users/interface/register-customer";

export class RegisterUserDto {
    @IsString()
    fullName: string;

    @IsString()
    @IsMobilePhone('vi-VN')
    phone?: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsString()
    @IsOptional()
    companyName?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    fields?: string;

    /**
     * Default is `ShowCustommer`
     * @example [public, private]
     */
     @IsEnum(ShowCustommer)
     @IsOptional()
     showCustommer: string;
}