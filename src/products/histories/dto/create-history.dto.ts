
export class CreateHistoryDto {
    product: string;
    before: object;
    after?: object;
    change: object;
    updatedBy: string;
}
