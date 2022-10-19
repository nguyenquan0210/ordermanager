import { IsArray, IsMongoId, IsOptional, IsString } from "class-validator";
export class CreateOrderCommentDto {
    @IsMongoId()
    order: string;

    @IsString()
    contentComment?: string;
}
export class CreateOrderReplyDto {
    @IsMongoId()
    idComment?: string;

    @IsString()
    contentComment?: string;
}