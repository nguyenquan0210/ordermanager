import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDemandGroupsDto } from './create-customer-demandGroup.dto';

export class UpdateCustomerDemandGroupsDto extends PartialType(CreateCustomerDemandGroupsDto) {}
