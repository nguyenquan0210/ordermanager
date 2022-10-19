import { Injectable, LoggerService } from '@nestjs/common';
import path from 'path';
import { NODE_ENV } from 'src/commons/constants/envConstanst';
import winston, { format } from "winston";
import "winston-daily-rotate-file";

@Injectable()
export class MyLogService implements LoggerService {
    log(message: any, context?: string) {
        if (typeof message === 'object')
            this.getLogger(context).info(JSON.stringify(message));
        else
            this.getLogger(context).info(message);
    }
    error(message: any, trace?: string, context?: string) {
        if (message) {
            if (typeof message === 'object')
                this.getLogger(context).error(JSON.stringify(message));
            else
                this.getLogger(context).error(message);
        }
        if (trace) this.getLogger(context).error(trace);
    }
    warn(message: any, context?: string) {
        if (typeof message === 'object') {
            this.getLogger(context).warn(JSON.stringify(message));
        } else {
            this.getLogger(context).warn(message);
        }
    }
    debug?(message: any, context?: string) {
        if (typeof message === 'object') {
            this.getLogger(context).debug(JSON.stringify(message));
        } else {
            this.getLogger(context).debug(message);
        }
    }
    verbose?(message: any, context?: string) {
        if (typeof message === 'object') {
            this.getLogger(context).verbose(JSON.stringify(message));
        } else {
            this.getLogger(context).verbose(message);
        }
    }

    constructor() {
    }

    protected createLogger(_label: string, options: { logLevel?: string, maxFile?: string }) {

        const log_dir = path.join(__dirname, '../../..', 'logs');

        const { combine, timestamp, label, printf } = format;

        const myFormat = printf(({ level, message, label, timestamp }) => {
            return `${timestamp} [${level}] ${message}`;
        });
        const transports: winston.transport[] = [];
        transports.push(
            new winston.transports.DailyRotateFile({
                dirname: log_dir,
                filename: `%DATE%-${_label}.log`,
                datePattern: 'YYYY-MM-DD',
                maxFiles: options.maxFile,
                level: options.logLevel ?? 'info',
                handleExceptions: true,
            }),
        );
        if (NODE_ENV == 'development') {
            transports.push(new winston.transports.Console({
                level: 'error',
            }));
        }

        winston.loggers.add(_label, {
            levels: winston.config.npm.levels,
            format: combine(
                label({ label: _label }),
                timestamp(),
                myFormat
            ),
            transports: transports,
            exceptionHandlers: [
                new winston.transports.File({
                    dirname: log_dir,
                    filename: 'exceptions.log'
                })
            ],
            exitOnError: false

        });
        return winston.loggers.get(_label);
    }

    protected getLogger(label: string = 'debug'): winston.Logger {
        let has = winston.loggers.has(label);
        if (has) {
            return winston.loggers.get(label);
        }
        const maxFile = (label == 'debug') ? '30d' : null;
        return this.createLogger(label, { maxFile: maxFile });
    }
}