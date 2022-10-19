import { IsEmail, IsString, Length } from "class-validator";

export class ResetPasswordDto {
    /**
     * @example abc@gmail.com
     */
    @IsEmail()
    email: string;
    /**
     * Secret code sent to email
     * @example 10101
     */
    @IsString()
    @Length(5, 5)
    code: string;
    /** New password to update 
     * @example new_password
    */
    @IsString()
    @Length(6)
    password: string;
}
