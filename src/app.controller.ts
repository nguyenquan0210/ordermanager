import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OkRespone } from 'src/commons/OkResponse';

@ApiTags('Healthcheck')
@Controller()
export class AppController {
    @Get()
    get() {
        return new OkRespone();
    }
}
