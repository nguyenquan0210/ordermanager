import { Test, TestingModule } from '@nestjs/testing';
import { TodoStatusService } from './todo-status.service';

describe('TodoStatusService', () => {
  let service: TodoStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TodoStatusService],
    }).compile();

    service = module.get<TodoStatusService>(TodoStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
