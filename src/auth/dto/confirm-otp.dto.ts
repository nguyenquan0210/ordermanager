import { IsEmail, IsString, Length } from "class-validator";

export class ConfirmOtpDto {
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

}