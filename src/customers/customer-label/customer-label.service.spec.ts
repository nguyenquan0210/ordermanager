import { Test, TestingModule } from '@nestjs/testing';
import { CustomerLabelService } from './customer-label.service';

describe('CustomerLabelService', () => {
  let service: CustomerLabelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomerLabelService],
    }).compile();

    service = module.get<CustomerLabelService>(CustomerLabelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
