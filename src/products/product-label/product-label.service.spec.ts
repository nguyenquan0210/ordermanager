import { Test, TestingModule } from '@nestjs/testing';
import { ProductLabelService } from './product-label.service';

describe('ProductLabelService', () => {
  let service: ProductLabelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductLabelService],
    }).compile();

    service = module.get<ProductLabelService>(ProductLabelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
