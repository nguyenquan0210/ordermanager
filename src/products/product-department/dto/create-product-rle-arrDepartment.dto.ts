import { IsArray, IsBoolean, IsMongoId, IsNumber, IsOptional, IsString } from "class-validator";
export class CreateRelateArrDepartmentDto {
    /**
     * Array of label's id
     * @example ["6118e9fcb952b9001ce3a9ea"]
     */
     @IsArray()
     @IsMongoId({ each: true })
     @IsOptional()
     department: string[];

     @IsNumber()
     quantity: number;

     @IsBoolean()
     wareHouse: boolean;
}