import { IsArray, IsDateString, IsEnum, IsMongoId, IsOptional, IsString, IsBoolean, IsNumber } from "class-validator";
import { TodoPriority } from "../interface/todo-status";
import { TodoTarget } from "../interface/todo-target";

export class CreateTodoDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    /**
     * Status todo
     * @example "6121fd40545c2f001175c1bf"
     */
    @IsMongoId()
    status: any;
    
    /**
     * target of todo. Default is `customer`
     * @example [low, medium, high]
     */
    @IsEnum(TodoPriority)
    @IsOptional()
    priority: string;

    @IsDateString()
    startDate?: Date;

    @IsDateString()
    dueDate?: Date;

    /**
     * target of todo. Default is `low`
     * @example [customer, internal]
     */
    @IsEnum(TodoTarget)
    @IsOptional()
    target?: string;

    /**
     * Users who take care of todo
     * @example ["6121fd40545c2f001175c1bf"]
     */
    @IsMongoId({ each: true })
    @IsOptional()
    assignee: string;

    /**
     * Staff who take care of todo
     * @example ["6121fd40545c2f001175c1bf"]
     */
     @IsMongoId({ each: true })
     @IsOptional()
     relateStaffs?: string[];

     /**
     * Product who take care of todo
     * @example ["6121fd40545c2f001175c1bf"]
     */
     @IsArray()
     @IsMongoId({ each: true })
     @IsOptional()
     relateProducts?: string[];
 
     /**
     * Customer who take care of todo
     * @example ["6121fd40545c2f001175c1bf"]
     */
     @IsArray()
     @IsMongoId({ each: true })
     @IsOptional()
     relateCustomers?: string[]; 

      /**
     * Demand who take care of todo
     * @example ["6121fd40545c2f001175c1bf"]
     */
    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    relateDemands?: string[]; 

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    labels?: string[];

    @IsMongoId()
    @IsOptional()
    orders?: string; 

    @IsString()
    @IsOptional()
    result?: string;

    /**
     * notification
     * @example false
     */
    @IsBoolean()
    @IsOptional()
    isNotification?: boolean;

    @IsNumber()
    @IsOptional()
    minutes?: number;
}