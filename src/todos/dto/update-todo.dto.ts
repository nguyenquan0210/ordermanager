import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { CreateTodoDto } from './create-todo.dto';

export class UpdateTodoDto extends PartialType(CreateTodoDto) {
    /**
     * Reason when todo is cancelled
     */
    @IsOptional()
    @IsString()
    cancelReason: string;

    /**
     * Check done of todo
     * @example false
     */
     @IsBoolean()
     @IsOptional()
     isDone: boolean;
}
