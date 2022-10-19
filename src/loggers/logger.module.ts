import { Global, Module } from '@nestjs/common';
import { MyLogService } from './winston.logger';

@Global()
@Module({
    providers: [MyLogService],
    exports: [MyLogService]
})
export class LoggerModule { }
