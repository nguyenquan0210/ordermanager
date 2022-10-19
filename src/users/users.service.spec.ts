import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AttributesDynamicService } from 'src/attributes/attribute-dynamic.service';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let findOne = jest.fn();
  let attrFindAllRequired = jest.fn().mockReturnValue([]);
  let newUserImpl = jest.fn();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AttributesDynamicService,
          useValue: {
            findAllRequired: attrFindAllRequired
          }
        },
        {
          provide: UsersService,
          useClass: UsersService
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne,
            constructor: newUserImpl,
          }
        }
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
