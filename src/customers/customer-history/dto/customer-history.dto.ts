
export class CreateCustomerHistoryDto {
    customer: string;
    before: object;
    after?: object;
    change?: object;
    updatedBy: string;
}
