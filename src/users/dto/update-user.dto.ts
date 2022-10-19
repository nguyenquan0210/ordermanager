import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsEnum, IsOptional, IsString } from "class-validator";
import { ShowCustommer } from "../interface/register-customer";

export class UpdateUserDto extends PartialType(
    OmitType(CreateUserDto, ['email', 'password', 'role'])
) { 
    /**
     * target of todo. Default is `ShowCustommer`
     * @example [public, private]
     */
     @IsEnum(ShowCustommer)
     @IsOptional()
     showCustommer: string;
}
