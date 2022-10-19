
export class CustomerQueryHistoryDto {
    search?: string;
    customer: string;
    updatedBy?: string;
    limit?: number;
    offset?: number;
    fromDate?: Date;
    toDate?: Date;
}