import { IsBoolean } from "class-validator";
export class UpdateCancelOrderDto {
    /**
     * Check done of order
     * @example false
     */
     @IsBoolean()
     isCancel: boolean;
}
