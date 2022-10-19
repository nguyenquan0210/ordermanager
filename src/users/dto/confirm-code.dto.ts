import { ConfirmCodeScope } from "../interface/confirmCodeScope"

export class ConfirmCodeDto {
    userId: string;
    token: string;
    scope: ConfirmCodeScope;
}