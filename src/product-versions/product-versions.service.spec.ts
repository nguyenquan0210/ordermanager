import { Test, TestingModule } from '@nestjs/testing';
import { ProductVerstionsService } from './product-versions.service';

describe('ProductVerstionsService', () => {
  let service: ProductVerstionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductVerstionsService],
    }).compile();

    service = module.get<ProductVerstionsService>(ProductVerstionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
