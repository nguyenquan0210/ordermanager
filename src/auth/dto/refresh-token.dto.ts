import { IsJWT } from "class-validator";

export class UserRefreshToken {
    @IsJWT()
    refreshToken: string;
    @IsJWT()
    accessToken: string;
}