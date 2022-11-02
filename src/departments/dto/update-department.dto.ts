import { PartialType } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsOptional, IsString, IsDateString, IsNumber } from "class-validator";
import { CreateDepartmentDto } from './create-department.dto';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
}
