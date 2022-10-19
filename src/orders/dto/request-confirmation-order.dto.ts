import { IsBoolean } from "class-validator";

export class RequestConfirmationOrderDto {
    /**
     * Check done of order
     * @example false
     */
    @IsBoolean()
    requestConfirmation: boolean;
}
