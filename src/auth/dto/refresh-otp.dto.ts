import { IsEmail } from "class-validator";

export class UserRefreshOtp {
   /**
     * @example abc@gmail.com
     */
    @IsEmail()
    email: string;
}