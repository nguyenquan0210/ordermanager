import { Test, TestingModule } from '@nestjs/testing';
import { CustomerDemandGroupsService } from './customer-demandGroup.service';

describe('CustomerDemandGroupsService', () => {
  let service: CustomerDemandGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomerDemandGroupsService],
    }).compile();

    service = module.get<CustomerDemandGroupsService>(CustomerDemandGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
