import { PartialType } from '@nestjs/swagger';
import { CreateTodoDemandDto } from './create-todo-demand.dto';
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateTodoDemandDto extends PartialType(CreateTodoDemandDto) {
    @IsBoolean()
    @IsOptional()
    isDone: boolean;
}
