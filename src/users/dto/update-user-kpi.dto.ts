import { OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsArray } from "class-validator";
import { CreateUserKPIDto } from './create-user-kpi.dto';

export class UpdateUserKPIDto extends PartialType(CreateUserKPIDto){
    
}
