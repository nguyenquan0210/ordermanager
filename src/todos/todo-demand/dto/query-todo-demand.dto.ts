import { PartialType } from "@nestjs/swagger";
import { QueryTodo } from "src/todos/dto/query-todo.dto";

export class QueryTodoDemand extends PartialType(QueryTodo) {
    demandDate?: Date;
    demandEndDate?: Date;
    labels?: string[] | string;
    customerId?: string;
}