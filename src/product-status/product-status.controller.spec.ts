import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatusController } from './product-status.controller';
import { ProductStatusService } from './product-status.service';

describe('ProductStatusController', () => {
  let controller: ProductStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductStatusController],
      providers: [ProductStatusService],
    }).compile();

    controller = module.get<ProductStatusController>(ProductStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
