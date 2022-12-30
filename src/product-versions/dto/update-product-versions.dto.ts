import { PartialType } from '@nestjs/swagger';
import { CreateProductVerstionsDto } from './create-product-versions.dto';

export class UpdateProductVerstionsDto extends PartialType(CreateProductVerstionsDto) {}
