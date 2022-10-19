import { NotificationType } from "src/commons/enum/notifications/notificationTypeEnum";

export class QueryNoti {
    search?: string;
    fromDate?: Date;
    toDate?: Date;
    type?: NotificationType;
    toDateAllNoti?: Date;
}