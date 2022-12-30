import { PartialType } from '@nestjs/swagger';
import { CreateProductTypesDto } from './create-product-types.dto';

export class UpdateProductTypesDto extends PartialType(CreateProductTypesDto) {}
