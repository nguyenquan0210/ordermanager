import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { MyLogService } from 'src/loggers/winston.logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(
        private logger: MyLogService
    ) { }
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest() as Request;

        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        let errorRes = exception instanceof HttpException
            ? (exception.getResponse() as { error }).error
            : "UnexpectedError";

        this.logger.error(`Req path: ${request.method} ${request.path}`);
        if (request.method == 'POST' || request.method == 'PUT') {
            this.logger.error(`Req body: ${JSON.stringify(request.body)}`);
        }
        this.logger.error('', (exception as Error).stack);

        let msg = exception instanceof HttpException
            ? (exception.getResponse() as { message }).message
            : undefined;

        // handle validation error from mongoose
        if ((exception as Error).name == 'ValidationError') {
            errorRes = 'ValidationError';
            msg = (exception as any).message;
        }
        let detail = exception instanceof HttpException
            ? (exception.getResponse() as { detail }).detail
            : undefined;
        response.status(status).json({
            statusCode: status,
            error: errorRes,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: Array.isArray(msg) && msg.length == 1 ? msg[0] : msg,
            detail: Array.isArray(detail) && detail.length == 1 ? detail[0] : detail,
        });
    }
}
