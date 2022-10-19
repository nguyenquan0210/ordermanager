import { IsBoolean, IsMongoId, IsObject, IsOptional, IsString, IsDateString, IsArray, IsNumber } from "class-validator";
import { NotificationType } from "src/commons/enum/notifications/notificationTypeEnum";

export class CreateNotificationDto {
    @IsString() 
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    type: NotificationType;

    @IsMongoId()
    @IsOptional()
    author: string;

    @IsBoolean()
    @IsOptional()
    isRead: boolean = false;

    @IsObject()
    @IsOptional()
    object?: object;

    @IsMongoId()
    @IsOptional()
    owner?: string;

    @IsMongoId()
    @IsOptional()
    relateStaff?: string;

    @IsDateString()
    @IsOptional()
    notiDate?: Date;

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    userRead?: string[];

    /**
     * Remind
     * @example false
    */
    @IsBoolean()
    @IsOptional()
    isRemind?: boolean;

    @IsNumber()
    @IsOptional()
    minutes?: number;
}
