export class AWSConfig {
    public static config = {
        AWS3_KEY_ID: process.env.AWS3_KEY_ID || 'YOUR_ACCESS_KEY_ID',
        AWS3_ACCESS_KEY: process.env.AWS3_ACCESS_KEY || 'YOUR_ACCESS_KEY',
        REGION: process.env.REGION || 'ap-southeast-1',
        BUCKET_NAME: process.env.BUCKET_NAME || 'BUCKET_NAME'
    }
}
