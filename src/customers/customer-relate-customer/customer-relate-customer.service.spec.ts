import { Test, TestingModule } from '@nestjs/testing';
import { CustomerRelateCustomerService } from './customer-relate-customer.service';

describe('CustomerRelateCustomerService', () => {
  let service: CustomerRelateCustomerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomerRelateCustomerService],
    }).compile();

    service = module.get<CustomerRelateCustomerService>(CustomerRelateCustomerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
