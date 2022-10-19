import { Test, TestingModule } from '@nestjs/testing';
import { CustomerRelateCustomerController } from './customer-relate-customer.controller';
import { CustomerRelateCustomerService } from './customer-relate-customer.service';

describe('CustomerRelateCustomerController', () => {
  let controller: CustomerRelateCustomerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerRelateCustomerController],
      providers: [CustomerRelateCustomerService],
    }).compile();

    controller = module.get<CustomerRelateCustomerController>(CustomerRelateCustomerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
