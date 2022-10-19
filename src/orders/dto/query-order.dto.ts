export class QueryOrder {
    search?: string;
    isOwner?: boolean;
    toDate?: Date;
    fromDate?: Date;
    staffId?: string[] | string;
    labels?: string;
    states?: string;
    toTotalMoney?: number;
    fromTotalMoney?: number;
    customers?: string;
    product?: string;
    requestConfirmation?: any;
}
