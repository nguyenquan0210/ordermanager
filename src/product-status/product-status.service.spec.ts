import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatusService } from './product-status.service';

describe('ProductStatusService', () => {
  let service: ProductStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductStatusService],
    }).compile();

    service = module.get<ProductStatusService>(ProductStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
