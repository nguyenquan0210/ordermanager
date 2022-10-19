import { Test, TestingModule } from '@nestjs/testing';
import { TodoHistoriesController } from './todo-history.controller';

describe('TodoHistoriesController', () => {
  let controller: TodoHistoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoHistoriesController],
    }).compile();

    controller = module.get<TodoHistoriesController>(TodoHistoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
