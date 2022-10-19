import { Test, TestingModule } from '@nestjs/testing';
import { SpeakerStylesService } from './speaker-styles.service';

describe('SpeakerStylesService', () => {
  let service: SpeakerStylesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpeakerStylesService],
    }).compile();

    service = module.get<SpeakerStylesService>(SpeakerStylesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
