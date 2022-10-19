import { IsBoolean } from "class-validator";
export class UpdateDoneOrderDto {
    /**
     * Check done of order
     * @example false
     */
    @IsBoolean()
    isDone: boolean;
}
