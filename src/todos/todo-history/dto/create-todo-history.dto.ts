
export class CreateTodoHistoryDto {
    todo: string;
    before: object;
    after?: object;
    change: object;
    updatedBy: string;
}
