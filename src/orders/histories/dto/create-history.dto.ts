
export class CreateHistoryDto {
    order: string;
    before: object;
    after?: object;
    change: object;
    updatedBy: string;
}
