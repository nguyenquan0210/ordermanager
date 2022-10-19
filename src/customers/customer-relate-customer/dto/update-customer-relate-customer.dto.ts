import { PartialType } from '@nestjs/swagger';
import { CreateCustomerRelateCustomerDto } from './create-customer-relate-customer.dto';

export class UpdateCustomerRelateCustomerDto extends PartialType(CreateCustomerRelateCustomerDto) {}
