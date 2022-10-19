import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AWSConfig } from "src/configs/aws.cnf";

const s3 = new S3Client({
    region: AWSConfig.config.REGION,
    credentials: {
        accessKeyId: AWSConfig.config.AWS3_KEY_ID,
        secretAccessKey: AWSConfig.config.AWS3_ACCESS_KEY,
    },
})

const uploadFile = async (option: { file: Express.Multer.File, filePath: string, mimetype?: string }) => {
    return await s3.send(new PutObjectCommand({
        Bucket: AWSConfig.config.BUCKET_NAME,
        Key: option.filePath,
        Body: option.file.buffer,
        CacheControl: 'max-age=31536000',
        ContentType: option.mimetype,
        ContentLength: option.file.size
    }));
}

const signedUrl = async (key: string, expireIn: number = 600) => {
    const command = new GetObjectCommand({
        Bucket: AWSConfig.config.BUCKET_NAME,
        Key: key
    });
    return await getSignedUrl(s3, command, { expiresIn: expireIn });
}

const deleteFile = async (key: string) => {
    
    const command = new HeadObjectCommand({ 
        Bucket: AWSConfig.config.BUCKET_NAME, 
        Key: key
    });
    const res = await s3.send(command);

    const response = await s3.send(new DeleteObjectCommand({
        Bucket: AWSConfig.config.BUCKET_NAME,
        Key: key
    }));
    return {response, size: res.ContentLength}
}
const deleteManyFiles = async (params: string[]) => {
    const objects = params.map(p => { return { Key: p } });

    let size = 0;
    for (let index = 0; index < params.length; index++) {
        const command = new HeadObjectCommand({ 
            Bucket: AWSConfig.config.BUCKET_NAME, 
            Key: params[index]
        });
        const res = await s3.send(command);
        size += res.ContentLength;
    }
    const response = await s3.send(new DeleteObjectsCommand({
        Bucket: AWSConfig.config.BUCKET_NAME,
        Delete: {
            Objects: objects,
        },
    }))
    return {response, size}
}

export { s3, uploadFile, signedUrl, deleteFile, deleteManyFiles }
