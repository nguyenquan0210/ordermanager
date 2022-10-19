import { IsNotEmpty, IsString } from "class-validator";

export class UserLoginDto {
    @IsString()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}