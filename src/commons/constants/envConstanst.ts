export const JwtConstants = {
    secret: process.env.SECRET_TOKEN || 'thisisprivate',
    accessTokenExpire: '120d',
    refreshTokenExpire: '100d',
    refresh_token_regen: 7 * 24 * 60 * 60, // 7 days in seconds
};

declare type ENV_TYPE = 'development' | 'staging' | 'production';
export const NODE_ENV: ENV_TYPE = (process.env.NODE_ENV || 'development') as ENV_TYPE;

export const SMTP_CONFIG = {
    HOST: process.env.SMTP_HOST,
    USER: process.env.SMTP_USER,
    PASS: process.env.SMTP_PASS,
    PORT: process.env.SMTP_PORT,
    SECURE: process.env.SMTP_SECURE == '1',
    FROM: process.env.SMTP_FROM,
}

export const CONFIRM_EMAIL_URL= process.env.CONFIRM_EMAIL_URL || 'http://localhost:3000/auth/confirm_email';

export const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/firebase-key.json';

export const CHECK_SIZE_FILE = {
    IMG: 1.5 * 1024 * 1024 ,
    VIDEO: 50 * 1024 * 1024,
    AUDIO: 20 * 1024 * 1024, 
    FILE: 25 * 1024 * 1024,
}

export const LABEL = {
    ID: 'NoId',
    NAME: 'No label',
    COLOR: '#efefef'
}
export const STATUS = {
    ID: 'NoId',
    NAME: 'No status',
    COLOR: '#efefef'
}

export const LEVEL_ACCOUNT = {
    FREE: {
        // CUSTOMER: 30,
        STAFF: 5,
        SIZE_FILE: 200 * 1024 * 1024 // 200 MB
    },
    START_UP: {
        // CUSTOMER: 30,
        STAFF: 10,
        SIZE_FILE: 1000 * 1024 * 1024
    },
    BASIC: {
        // CUSTOMER: 30,
        STAFF: 20,
        SIZE_FILE: 5000 * 1024 * 1024
    },
    ADVANCE: {
        // CUSTOMER: Infinity,
        STAFF: Infinity,
        SIZE_FILE: Infinity
    }
}