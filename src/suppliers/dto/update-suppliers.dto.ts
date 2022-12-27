import { PartialType } from '@nestjs/swagger';
import { CreateSuppliersDto } from './create-suppliers.dto';

export class UpdateSuppliersDto extends PartialType(CreateSuppliersDto) {}
