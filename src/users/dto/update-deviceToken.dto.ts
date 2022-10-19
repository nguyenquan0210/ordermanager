import { IsString } from "class-validator";

export class UpdateDeviceTokenDto {

    @IsString()
    tokenFirebase?: string;
}