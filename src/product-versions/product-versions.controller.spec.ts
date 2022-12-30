import { Test, TestingModule } from '@nestjs/testing';
import { ProductVerstionsController } from './product-versions.controller';
import { ProductVerstionsService } from './product-versions.service';

describe('ProductVerstionsController', () => {
  let controller: ProductVerstionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductVerstionsController],
      providers: [ProductVerstionsService],
    }).compile();

    controller = module.get<ProductVerstionsController>(ProductVerstionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
