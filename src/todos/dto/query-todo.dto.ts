import { Customer } from './../../customers/entities/customer.entity';
import { NotificationType } from "src/commons/enum/notifications/notificationTypeEnum";
import { TodoPriority } from "../interface/todo-status";
import { TodoTarget } from "../interface/todo-target";

export class QueryTodo {
    search?: string;
    status?: string;
    priority?: TodoPriority;
    assignee?: string | string[];
    fromDate?: Date;
    toDate?: Date;
    target?: TodoTarget;
    relate?: number;
    type?: NotificationType;
    labels?: string[] | string;
    staffId?: string[] | string;
    customerId?: string;
}