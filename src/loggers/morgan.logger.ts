import morgan, { StreamOptions } from "morgan";
import { MyLogService } from "./winston.logger";

export class MorganLogService extends MyLogService {
    constructor() {
        super();

        const morganLog = this.createLogger('access', { logLevel: 'http', maxFile: '30d' });
        const _stream: StreamOptions = {
            write: (str) => {
                morganLog.info(str);
            }
        }
        this.#stream = _stream;
    }

    readonly #log_fmt = ':remote-addr xfwd :req[x-forwarded-for] | :method :url HTTP/:http-version :status :res[content-length] - :response-time ms - :user-agent';
    readonly #stream;
    public middleware() {
        return (morgan(this.#log_fmt, { stream: this.#stream }));
    }
}