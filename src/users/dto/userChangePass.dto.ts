import { IsString, MinLength } from "class-validator";

export class UserChangePassword {
    @IsString()
    currentPassword: string;
    @IsString()
    @MinLength(6)
    newPassword: string;
}