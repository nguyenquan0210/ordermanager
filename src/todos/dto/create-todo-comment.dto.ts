import { IsArray, IsMongoId, IsOptional, IsString } from "class-validator";

export class CreateTodoCommentDto {
    @IsMongoId()
    todo: string;

    @IsString()
    contentComment?: string;
}

export class CreateTodoReplyDto {
    @IsMongoId()
    idComment?: string;

    @IsString()
    contentComment?: string;
}