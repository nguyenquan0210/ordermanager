import { Test, TestingModule } from '@nestjs/testing';
import { CustomerNoteService } from './customer-note.service';

describe('CustomerNoteService', () => {
  let service: CustomerNoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomerNoteService],
    }).compile();

    service = module.get<CustomerNoteService>(CustomerNoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
